# Задача: Страница профиля компании (MVP 0)

## Описание
Простая страница для просмотра и редактирования профиля компании.

## Цель
Позволить пользователям видеть и редактировать информацию о своей компании, а также управлять продуктами/услугами.

## Технические требования

### 1. src/pages/CompanyProfile.jsx
```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { companiesAPI } from '../api/companies';
import { productsAPI } from '../api/products';

function CompanyProfile() {
  const { id } = useParams();  // Если просматриваем чужую компанию
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState({ offered: [], needed: [] });
  const [isOwn, setIsOwn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadCompanyData();
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      if (id) {
        // Просмотр чужой компании
        const data = await companiesAPI.getCompany(id);
        setCompany(data.company);
        setProducts(data.products);
        setIsOwn(false);
      } else {
        // Просмотр своей компании
        const data = await companiesAPI.getMyCompany();
        setCompany(data.company);
        setProducts(data.products);
        setIsOwn(true);
        setFormData({
          description: data.company.description || '',
          website: data.company.website || '',
          phone: data.company.phone || '',
          email: data.company.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await companiesAPI.updateCompany(company.id, formData);
      alert('Профиль обновлен');
      setEditing(false);
      loadCompanyData();
    } catch (error) {
      alert('Ошибка обновления');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!company) return <div>Компания не найдена</div>;

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <h1>{company.full_name}</h1>
      <p style={{ color: '#666' }}>ИНН: {company.inn}</p>

      {/* Основная информация */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2>О компании</h2>
        
        {isOwn && editing ? (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Сайт</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button type="submit" className="btn">Сохранить</button>
            <button type="button" onClick={() => setEditing(false)} style={{ marginLeft: '0.5rem' }}>
              Отмена
            </button>
          </form>
        ) : (
          <>
            <p>{company.description || 'Нет описания'}</p>
            <p>Сайт: {company.website || 'Не указан'}</p>
            <p>Телефон: {company.phone || 'Не указан'}</p>
            <p>Email: {company.email || 'Не указан'}</p>
            
            {isOwn && (
              <button onClick={() => setEditing(true)} className="btn" style={{ marginTop: '1rem' }}>
                Редактировать
              </button>
            )}
          </>
        )}
      </div>

      {/* Продукты и услуги */}
      <ProductsList
        products={products}
        isOwn={isOwn}
        onUpdate={loadCompanyData}
      />
    </div>
  );
}

// Компонент для списка продуктов
function ProductsList({ products, isOwn, onUpdate }) {
  const [newProduct, setNewProduct] = useState({ type: 'offered', name: '', description: '' });
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.createProduct(newProduct);
      setNewProduct({ type: 'offered', name: '', description: '' });
      setAdding(false);
      onUpdate();
    } catch (error) {
      alert('Ошибка добавления');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить?')) {
      try {
        await productsAPI.deleteProduct(id);
        onUpdate();
      } catch (error) {
        alert('Ошибка удаления');
      }
    }
  };

  return (
    <>
      <div style={{ marginTop: '2rem' }}>
        <h2>Я ПРОДАЮ</h2>
        {products.offered.length === 0 ? (
          <p>Нет продуктов</p>
        ) : (
          <ul>
            {products.offered.map(p => (
              <li key={p.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <strong>{p.name}</strong>
                <p>{p.description}</p>
                {isOwn && (
                  <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>
                    Удалить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Я ПОКУПАЮ</h2>
        {products.needed.length === 0 ? (
          <p>Нет потребностей</p>
        ) : (
          <ul>
            {products.needed.map(p => (
              <li key={p.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <strong>{p.name}</strong>
                <p>{p.description}</p>
                {isOwn && (
                  <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>
                    Удалить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwn && (
        <div style={{ marginTop: '2rem' }}>
          {adding ? (
            <form onSubmit={handleAdd} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3>Добавить</h3>
              <div className="form-group">
                <label>Тип</label>
                <select value={newProduct.type} onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}>
                  <option value="offered">Я ПРОДАЮ</option>
                  <option value="needed">Я ПОКУПАЮ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Название *</label>
                <input
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <button type="submit" className="btn">Добавить</button>
              <button type="button" onClick={() => setAdding(false)} style={{ marginLeft: '0.5rem' }}>
                Отмена
              </button>
            </form>
          ) : (
            <button onClick={() => setAdding(true)} className="btn">
              Добавить продукт/услугу
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default CompanyProfile;
```

## Критерии приёмки
- [ ] Просмотр профиля своей компании работает
- [ ] Просмотр профиля чужой компании работает
- [ ] Редактирование профиля работает (только для своей компании)
- [ ] Список "Я ПРОДАЮ" отображается
- [ ] Список "Я ПОКУПАЮ" отображается
- [ ] Добавление продукта/услуги работает
- [ ] Удаление продукта/услуги работает
- [ ] Различие между своим и чужим профилем работает

## Зависимости
- Задача 01-react-vite-setup
- Задача 03-company-crud (backend)
- Задача 04-products-crud (backend)

## Приоритет
Критический (P0)

## Оценка времени
3-4 часа


