import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Screen from '../components/Screen';
import { useDeleteConfirmation } from '../components/DeleteConfirmation';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { categoryService } from '../services/categoryService';
import { blankProductForm, validateProductForm } from '../utils/productForm';

const modalities = ['Futebol', 'Basquete', 'Corrida', 'Treino', 'Casual', 'Outro'];
const sizes = ['P', 'M', 'G', 'GG', 'Único'];
const validCategoryName = value => /^[\p{L} ]+$/u.test(String(value || '').trim());

export default function AddProductScreen({ navigation, route }) {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return (
      <Screen navigation={navigation} active="Account">
        <BackLink navigation={navigation} fallback="Account" />
        <View style={{ padding: 24 }}>
          <Text>{user ? 'Somente administradores podem cadastrar produtos.' : 'Entre na sua conta para cadastrar produtos.'}</Text>
        </View>
      </Screen>
    );
  }

  return <ProductForm navigation={navigation} product={route?.params?.product || null} />;
}

function ProductForm({ navigation, product }) {
  const { createProduct, updateProduct } = useProducts();
  const [form, setForm] = useState(() => product
    ? {
        name: product.name || '',
        description: product.description || '',
        price: String(product.price ?? ''),
        salePrice: product.salePrice == null ? '' : String(product.salePrice),
        category: product.category || '',
        categoryId: product.categoryId || null,
        modality: product.modality || '',
        team: product.team === 'Sem time' ? '' : (product.team || ''),
        stock: String(product.stock ?? 0),
        minimumStock: String(product.minimumStock ?? 5),
        sizes: product.sizes || [],
        imageUrl: product.imageUrl || product.images?.[0] || '',
      }
    : { ...blankProductForm, categoryId: null, sizes: [] });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryManagement, setCategoryManagement] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const pending = useRef(false);
  const deletion = useDeleteConfirmation();

  async function loadCategories() {
    setCategoriesLoading(true);
    setCategoryError('');
    try {
      const result = await categoryService.list();
      setCategories(result);
    } catch (e) {
      setCategoryError(e?.message || 'Não foi possível carregar as categorias.');
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    setError('');
  }

  function chooseCategory(category) {
    setForm(current => ({
      ...current,
      category: category.name,
      categoryId: category.id || null,
    }));
    setCategoryMenuOpen(false);
    setCategoryError('');
    setError('');
  }

  function toggleSize(size) {
    const selected = form.sizes;
    change(
      'sizes',
      selected.includes(size)
        ? selected.filter(item => item !== size)
        : size === 'Único'
          ? ['Único']
          : [...selected.filter(item => item !== 'Único'), size]
    );
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!validCategoryName(name)) {
      setCategoryError('Use apenas letras e espaços no nome da categoria.');
      return;
    }
    if (categories.some(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setCategoryError('Essa categoria já existe.');
      return;
    }

    setCategoryBusy(true);
    setCategoryError('');
    try {
      const created = await categoryService.create(name);
      setCategories(current => [...current, created]);
      chooseCategory(created);
      setNewCategory('');
      setCategoryManagement(null);
    } catch (e) {
      setCategoryError(e?.message || 'Não foi possível adicionar a categoria.');
    } finally {
      setCategoryBusy(false);
    }
  }

  function performDeleteCategory(category) {
    const remove = async () => {
      setCategoryBusy(true);
      setCategoryError('');
      try {
        await categoryService.remove(category.id);
        setCategories(current => current.filter(item => item.id !== category.id));
        setForm(current => current.categoryId === category.id
          ? { ...current, category: '', categoryId: null }
          : current);
        setCategoryManagement(null);
        setCategoryMenuOpen(true);
      } catch (e) {
        throw e;
      } finally {
        setCategoryBusy(false);
      }
    };

    deletion.open(`Deseja realmente excluir a categoria "${category.name}"?`, remove);

  }

  async function save() {
    if (pending.current) return;
    const validation = validateProductForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const savedProduct = product
        ? await updateProduct(product.id, form)
        : await createProduct(form);
      // Volta à tela administrativa existente, sem criar outra cópia dela.
      if (navigation.canGoBack()) {
        navigation.popTo('Admin', { createdProductId: savedProduct.id });
      } else {
        navigation.navigate('Admin', { createdProductId: savedProduct.id });
      }
    } catch (e) {
      setError(e.message || 'Não foi possível salvar. Tente novamente.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  function input(key, label, options = {}) {
    return (
      <View key={key}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          editable={!saving}
          style={[styles.input, options.multiline && styles.multiline]}
          placeholderTextColor="#888"
          value={form[key]}
          onChangeText={value => change(key, value)}
          {...options}
        />
      </View>
    );
  }

  const currentCategoryExists = categories.some(item => item.name === form.category);
  const displayCategories = form.category && !currentCategoryExists
    ? [{ id: form.categoryId || '', name: form.category, legacy: true }, ...categories]
    : categories;

  return (
    <Screen navigation={navigation} active="Account">
      {deletion.dialog}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <BackLink navigation={navigation} fallback="Admin" label="← ADMINISTRAÇÃO" />
          <View style={styles.form}>
            <Text style={styles.eyebrow}>BLACKWEAR / CATÁLOGO</Text>
            <Text style={styles.title}>{product ? 'Editar produto' : 'Adicionar produto'}</Text>
            <Text style={styles.description}>A foto do produto é obrigatória. Use uma URL pública de imagem.</Text>

            {input('name', 'Nome do produto', { placeholder: 'Nome do item', maxLength: 100 })}
            {input('description', 'Descrição (opcional)', { placeholder: 'Detalhes do produto', multiline: true, maxLength: 1200 })}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>{input('price', 'Preço (R$)', { placeholder: '129,90', keyboardType: 'decimal-pad', maxLength: 12 })}</View>
              <View style={{ flex: 1 }}>{input('salePrice', 'Oferta (opcional)', { placeholder: '99,90', keyboardType: 'decimal-pad', maxLength: 12 })}</View>
            </View>

            <Text style={styles.label}>Categoria</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selecionar categoria"
              accessibilityState={{ expanded: categoryMenuOpen }}
              disabled={saving || categoryBusy}
              style={styles.dropdown}
              onPress={() => {
                setCategoryMenuOpen(open => !open);
                setCategoryManagement(null);
                setCategoryError('');
              }}
            >
              <Text style={[styles.dropdownText, !form.category && styles.placeholder]}>
                {form.category || (categoriesLoading ? 'Carregando categorias...' : 'Selecione uma categoria')}
              </Text>
              <Text style={styles.chevron}>{categoryMenuOpen ? '⌃' : '⌄'}</Text>
            </Pressable>

            {categoryMenuOpen && (
              <View style={styles.dropdownMenu}>
                {categoriesLoading ? (
                  <Text style={styles.helper}>Carregando categorias...</Text>
                ) : displayCategories.length ? displayCategories.map(category => (
                  <Pressable
                    key={category.id || `legacy-${category.name}`}
                    accessibilityRole="button"
                    style={styles.categoryOption}
                    onPress={() => chooseCategory(category)}
                  >
                    <Text style={[styles.categoryOptionText, form.category === category.name && styles.selectedCategory]}>
                      {category.name}
                    </Text>
                    {form.category === category.name && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                )) : (
                  <Text style={styles.helper}>Ainda não há categorias cadastradas.</Text>
                )}
                <View style={styles.categoryTools}>
                  <Pressable style={styles.categoryTool} onPress={() => { setCategoryManagement('add'); setCategoryError(''); }}>
                    <Text style={styles.categoryToolText}>＋ Adicionar categoria</Text>
                  </Pressable>
                  <Pressable style={styles.categoryTool} onPress={() => { setCategoryManagement('delete'); setCategoryError(''); }}>
                    <Text style={[styles.categoryToolText, { color: '#b42318' }]}>− Excluir categoria</Text>
                  </Pressable>
                </View>
                {categoryManagement === 'add' && (
                  <View style={styles.categoryEditor}>
                    <TextInput
                      accessibilityLabel="Nome da nova categoria"
                      value={newCategory}
                      onChangeText={setNewCategory}
                      placeholder="Nome da categoria"
                      placeholderTextColor="#888"
                      autoCapitalize="words"
                      editable={!categoryBusy}
                      style={styles.input}
                      maxLength={50}
                    />
                    <Pressable disabled={categoryBusy} style={styles.miniPrimary} onPress={addCategory}>
                      <Text style={styles.miniPrimaryText}>{categoryBusy ? 'SALVANDO...' : 'ADICIONAR'}</Text>
                    </Pressable>
                  </View>
                )}
                {categoryManagement === 'delete' && (
                  <View style={styles.categoryEditor}>
                    {!categories.length ? (
                      <Text style={styles.helper}>Não há categorias para excluir.</Text>
                    ) : categories.map(category => (
                      <View key={category.id} style={styles.deleteCategoryRow}>
                        <Text style={styles.categoryOptionText}>{category.name}</Text>
                        <Pressable
                          disabled={categoryBusy}
                          accessibilityRole="button"
                          accessibilityLabel={`Excluir categoria ${category.name}`}
                          onPress={() => performDeleteCategory(category)}
                          style={styles.deleteCategoryButton}
                        >
                          <Text style={styles.deleteCategoryText}>EXCLUIR</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
                {!!categoryError && <Text accessibilityRole="alert" style={styles.categoryError}>{categoryError}</Text>}
                <Pressable style={styles.refreshCategories} onPress={loadCategories} disabled={categoryBusy}>
                  <Text style={styles.helper}>Atualizar categorias</Text>
                </Pressable>
              </View>
            )}

            {input('stock', 'Quantidade em estoque', { placeholder: '0', keyboardType: 'number-pad', maxLength: 8 })}
            {input('minimumStock', 'Alerta de estoque mínimo', { placeholder: '5', keyboardType: 'number-pad', maxLength: 8 })}

            <Text style={styles.label}>Modalidade</Text>
            <View style={styles.options}>
              {modalities.map(option => (
                <Pressable key={option} accessibilityRole="radio" accessibilityLabel={`Modalidade ${option}`} accessibilityState={{ checked: form.modality === option }} disabled={saving} style={[styles.chip, form.modality === option && styles.active]} onPress={() => change('modality', option)}>
                  <Text style={[styles.chipText, form.modality === option && styles.activeText]}>{option}</Text>
                </Pressable>
              ))}
            </View>

            {input('team', 'Time (opcional)', { placeholder: 'Deixe vazio se não houver time', maxLength: 60 })}

            <Text style={styles.label}>Tamanhos disponíveis</Text>
            <View style={styles.options}>
              {sizes.map(size => (
                <Pressable key={size} accessibilityRole="checkbox" accessibilityLabel={`Tamanho ${size}`} accessibilityState={{ checked: form.sizes.includes(size) }} disabled={saving} style={[styles.chip, form.sizes.includes(size) && styles.active]} onPress={() => toggleSize(size)}>
                  <Text style={[styles.chipText, form.sizes.includes(size) && styles.activeText]}>{size}</Text>
                </Pressable>
              ))}
            </View>

            {input('imageUrl', 'URL da imagem (obrigatória)', { placeholder: 'https://...', keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false, maxLength: 2000 })}
            {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}

            <Pressable accessibilityRole="button" accessibilityLabel="Salvar produto" disabled={saving} style={[styles.save, saving && { opacity: 0.5 }]} onPress={save}>
              <Text style={styles.saveText}>{saving ? 'SALVANDO...' : 'SALVAR PRODUTO'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.cancel} disabled={saving} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  form: { padding: 20 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#777', marginBottom: 8 },
  title: { fontSize: 27, fontWeight: '900', marginBottom: 10 },
  description: { fontSize: 12, lineHeight: 19, color: '#777', marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 48, padding: 13, borderRadius: 9, borderWidth: 1, borderColor: '#ccc', fontSize: 14, color: '#111', backgroundColor: '#fafafa', marginBottom: 20 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: { minHeight: 42, minWidth: 44, paddingHorizontal: 13, borderWidth: 1, borderColor: '#ccc', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12 },
  active: { backgroundColor: '#111', borderColor: '#111' },
  activeText: { color: '#fff', fontWeight: '700' },
  dropdown: { minHeight: 52, borderWidth: 1.5, borderColor: '#111', borderRadius: 12, paddingHorizontal: 15, marginBottom: 18, backgroundColor: '#fafafa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { color: '#111', fontSize: 14 },
  placeholder: { color: '#888' },
  chevron: { fontSize: 20, color: '#333' },
  dropdownMenu: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginTop: -10, marginBottom: 20, padding: 10, backgroundColor: '#fff' },
  categoryOption: { minHeight: 42, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoryOptionText: { fontSize: 13, color: '#222' },
  selectedCategory: { fontWeight: '800' },
  checkmark: { fontSize: 15, fontWeight: '800' },
  categoryTools: { gap: 6, paddingTop: 10 },
  categoryTool: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 8 },
  categoryToolText: { fontSize: 12, fontWeight: '800', color: '#222' },
  categoryEditor: { paddingTop: 10 },
  miniPrimary: { minHeight: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 20, marginBottom: 10 },
  miniPrimaryText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  deleteCategoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  deleteCategoryButton: { borderWidth: 1, borderColor: '#b42318', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8 },
  deleteCategoryText: { color: '#b42318', fontSize: 9, fontWeight: '800' },
  refreshCategories: { padding: 8, alignItems: 'center' },
  helper: { fontSize: 11, color: '#777', paddingVertical: 8 },
  categoryError: { color: '#b42318', fontSize: 12, lineHeight: 18, padding: 8 },
  error: { fontSize: 12, lineHeight: 19, color: '#a32020', marginBottom: 16 },
  save: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  saveText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cancelText: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
});
