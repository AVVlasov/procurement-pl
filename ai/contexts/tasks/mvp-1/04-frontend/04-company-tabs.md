# Задача: Профиль компании с вкладками (MVP 1)

## Описание
Улучшение страницы профиля компании с разделением на вкладки для лучшей организации информации.

## Цель
Сделать профиль компании более структурированным и удобным для просмотра.

## Технические требования

### 1. Структура вкладок

1. **О компании** - основная информация
2. **Я ПРОДАЮ** - предлагаемые продукты/услуги
3. **Я ПОКУПАЮ** - потребности компании
4. **Реквизиты** - юридическая информация
5. **Статистика** - просмотры и активность

### 2. Компонент вкладок

**src/components/ui/Tabs.jsx**
```jsx
import { useState } from 'react';

function Tabs({ tabs, defaultTab = 0, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div>
      {/* Tab buttons */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                transition-colors duration-200
                ${
                  activeTab === index
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 badge badge-primary">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {typeof children === 'function' ? children(activeTab) : tabs[activeTab]?.content}
      </div>
    </div>
  );
}

export default Tabs;
```

### 3. Обновленный CompanyProfile.jsx

**src/pages/CompanyProfile.jsx**
```jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyCompany, fetchCompanyById } from '../store/slices/companySlice';
import { fetchMyProducts } from '../store/slices/productsSlice';
import Tabs from '../components/ui/Tabs';
import { Spinner, Card, Badge } from '../components/ui';
import AboutTab from '../components/company/AboutTab';
import OfferedTab from '../components/company/OfferedTab';
import NeededTab from '../components/company/NeededTab';
import DetailsTab from '../components/company/DetailsTab';
import StatsTab from '../components/company/StatsTab';

function CompanyProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { myCompany, currentCompany, loading } = useSelector((state) => state.company);
  const { offered, needed } = useSelector((state) => state.products);

  const isOwn = !id;
  const company = isOwn ? myCompany : currentCompany;

  useEffect(() => {
    if (isOwn) {
      dispatch(fetchMyCompany());
      dispatch(fetchMyProducts());
    } else {
      dispatch(fetchCompanyById(id));
    }
  }, [id, isOwn, dispatch]);

  if (loading || !company) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'about',
      label: 'О компании',
      icon: '🏢',
      content: <AboutTab company={company} isOwn={isOwn} />,
    },
    {
      id: 'offered',
      label: 'Я ПРОДАЮ',
      icon: '📦',
      badge: offered.length,
      content: <OfferedTab products={offered} isOwn={isOwn} />,
    },
    {
      id: 'needed',
      label: 'Я ПОКУПАЮ',
      icon: '🛒',
      badge: needed.length,
      content: <NeededTab products={needed} isOwn={isOwn} />,
    },
    {
      id: 'details',
      label: 'Реквизиты',
      icon: '📄',
      content: <DetailsTab company={company} isOwn={isOwn} />,
    },
  ];

  // Добавить вкладку статистики только для своей компании
  if (isOwn) {
    tabs.push({
      id: 'stats',
      label: 'Статистика',
      icon: '📊',
      content: <StatsTab company={company} />,
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {company.full_name}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-secondary-600">
              <span>ИНН: {company.inn}</span>
              {company.industry && (
                <>
                  <span>•</span>
                  <Badge variant="primary">{company.industry}</Badge>
                </>
              )}
              {company.city && (
                <>
                  <span>•</span>
                  <span>📍 {company.city}</span>
                </>
              )}
            </div>
          </div>
          {isOwn && (
            <Badge variant="success">Мой профиль</Badge>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs tabs={tabs} />
      </Card>
    </div>
  );
}

export default CompanyProfile;
```

### 4. Вкладка "О компании"

**src/components/company/AboutTab.jsx**
```jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateCompany } from '../../store/slices/companySlice';
import { Button, Input } from '../ui';
import { useToast } from '../../hooks/useToast';

function AboutTab({ company, isOwn }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: company.description || '',
    website: company.website || '',
    phone: company.phone || '',
    email: company.email || '',
    address: company.address || '',
  });
  const dispatch = useDispatch();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateCompany({ id: company.id, data: formData })).unwrap();
      toast.success('Профиль обновлен');
      setEditing(false);
    } catch (error) {
      toast.error('Ошибка обновления профиля');
    }
  };

  const handleCancel = () => {
    setFormData({
      description: company.description || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Описание компании</label>
          <textarea
            className="input"
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Расскажите о вашей компании..."
          />
        </div>

        <Input
          label="Веб-сайт"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://example.com"
        />

        <Input
          label="Телефон"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+7 (999) 123-45-67"
        />

        <Input
          label="Email для связи"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contact@company.com"
        />

        <Input
          label="Адрес"
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="г. Москва, ул. Примерная, д. 1"
        />

        <div className="flex space-x-3">
          <Button type="submit">Сохранить</Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Описание */}
      <div>
        <h3 className="text-sm font-medium text-secondary-500 mb-2">
          О компании
        </h3>
        <p className="text-secondary-900 whitespace-pre-wrap">
          {company.description || 'Нет описания'}
        </p>
      </div>

      {/* Контакты */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-secondary-500 mb-2">
            Контактная информация
          </h3>
          <div className="space-y-2">
            {company.website && (
              <div className="flex items-center space-x-2">
                <span className="text-secondary-600">🌐</span>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center space-x-2">
                <span className="text-secondary-600">📞</span>
                <a
                  href={`tel:${company.phone}`}
                  className="text-secondary-900"
                >
                  {company.phone}
                </a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center space-x-2">
                <span className="text-secondary-600">✉️</span>
                <a
                  href={`mailto:${company.email}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {company.email}
                </a>
              </div>
            )}
            {company.address && (
              <div className="flex items-center space-x-2">
                <span className="text-secondary-600">📍</span>
                <span className="text-secondary-900">{company.address}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-secondary-500 mb-2">
            Дополнительная информация
          </h3>
          <div className="space-y-2 text-sm">
            {company.registration_date && (
              <div>
                <span className="text-secondary-600">Дата регистрации: </span>
                <span className="text-secondary-900">
                  {new Date(company.registration_date).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
            {company.employee_count && (
              <div>
                <span className="text-secondary-600">Кол-во сотрудников: </span>
                <span className="text-secondary-900">{company.employee_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isOwn && (
        <div className="pt-4">
          <Button onClick={() => setEditing(true)}>
            Редактировать
          </Button>
        </div>
      )}
    </div>
  );
}

export default AboutTab;
```

### 5. Вкладка "Я ПРОДАЮ"

**src/components/company/OfferedTab.jsx**
```jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createProduct, updateProduct, deleteProduct } from '../../store/slices/productsSlice';
import { Button, Card } from '../ui';
import { useToast } from '../../hooks/useToast';
import ProductForm from './ProductForm';

function OfferedTab({ products, isOwn }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const dispatch = useDispatch();
  const toast = useToast();

  const handleAdd = async (data) => {
    try {
      await dispatch(createProduct({ ...data, type: 'offered' })).unwrap();
      toast.success('Продукт добавлен');
      setAdding(false);
    } catch (error) {
      toast.error('Ошибка добавления');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await dispatch(updateProduct({ id, data })).unwrap();
      toast.success('Продукт обновлен');
      setEditing(null);
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить продукт?')) return;
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success('Продукт удален');
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-4">
      {products.length === 0 && !adding ? (
        <div className="text-center py-12 text-secondary-500">
          <div className="text-4xl mb-4">📦</div>
          <p className="mb-4">Нет продуктов или услуг</p>
          {isOwn && (
            <Button onClick={() => setAdding(true)}>
              Добавить продукт/услугу
            </Button>
          )}
        </div>
      ) : (
        <>
          {products.map((product) => (
            <Card key={product.id} hoverable={!isOwn}>
              {editing === product.id ? (
                <ProductForm
                  initialData={product}
                  onSubmit={(data) => handleUpdate(product.id, data)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-secondary-700 whitespace-pre-wrap mb-3">
                          {product.description}
                        </p>
                      )}
                      {product.price && (
                        <div className="text-primary-600 font-medium">
                          {product.price.toLocaleString('ru-RU')} ₽
                          {product.price_unit && ` / ${product.price_unit}`}
                        </div>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isOwn && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditing(product.id)}
                          className="text-primary-600 hover:text-primary-700 p-2"
                          title="Редактировать"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-error hover:text-error/80 p-2"
                          title="Удалить"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}

          {isOwn && !adding && (
            <Button variant="outline" onClick={() => setAdding(true)}>
              + Добавить продукт/услугу
            </Button>
          )}
        </>
      )}

      {adding && (
        <Card>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Новый продукт/услуга
          </h3>
          <ProductForm
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}
    </div>
  );
}

export default OfferedTab;
```

### 6. Форма продукта

**src/components/company/ProductForm.jsx**
```jsx
import { useState } from 'react';
import { Button, Input } from '../ui';

function ProductForm({ initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    price: initialData.price || '',
    price_unit: initialData.price_unit || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="Например: Разработка веб-приложений"
      />

      <div>
        <label className="label">Описание</label>
        <textarea
          className="input"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Подробное описание продукта или услуги..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Цена (опционально)"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="10000"
        />
        <Input
          label="Единица измерения"
          value={formData.price_unit}
          onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
          placeholder="шт, час, месяц"
        />
      </div>

      <div className="flex space-x-3">
        <Button type="submit">
          {initialData.id ? 'Обновить' : 'Добавить'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
```

### 7. Вкладка "Я ПОКУПАЮ"

**src/components/company/NeededTab.jsx**
```jsx
// Аналогично OfferedTab, но для потребностей
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createProduct, updateProduct, deleteProduct } from '../../store/slices/productsSlice';
import { Button, Card } from '../ui';
import { useToast } from '../../hooks/useToast';
import ProductForm from './ProductForm';

function NeededTab({ products, isOwn }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const dispatch = useDispatch();
  const toast = useToast();

  const handleAdd = async (data) => {
    try {
      await dispatch(createProduct({ ...data, type: 'needed' })).unwrap();
      toast.success('Потребность добавлена');
      setAdding(false);
    } catch (error) {
      toast.error('Ошибка добавления');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await dispatch(updateProduct({ id, data })).unwrap();
      toast.success('Потребность обновлена');
      setEditing(null);
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить потребность?')) return;
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success('Потребность удалена');
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-4">
      {products.length === 0 && !adding ? (
        <div className="text-center py-12 text-secondary-500">
          <div className="text-4xl mb-4">🛒</div>
          <p className="mb-4">Нет потребностей</p>
          {isOwn && (
            <Button onClick={() => setAdding(true)}>
              Добавить потребность
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Аналогично OfferedTab */}
          {products.map((product) => (
            <Card key={product.id} hoverable={!isOwn}>
              {/* ... контент карточки */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-secondary-700 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  )}
                </div>
                {isOwn && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditing(product.id)}
                      className="text-primary-600 hover:text-primary-700 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-error hover:text-error/80 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {isOwn && !adding && (
            <Button variant="outline" onClick={() => setAdding(true)}>
              + Добавить потребность
            </Button>
          )}
        </>
      )}

      {adding && (
        <Card>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Новая потребность
          </h3>
          <ProductForm
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}
    </div>
  );
}

export default NeededTab;
```

### 8. Вкладка "Реквизиты"

**src/components/company/DetailsTab.jsx**
```jsx
function DetailsTab({ company, isOwn }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Юридическая информация */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Юридическая информация
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-secondary-500">Полное наименование</dt>
              <dd className="text-secondary-900">{company.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary-500">ИНН</dt>
              <dd className="text-secondary-900 font-mono">{company.inn}</dd>
            </div>
            {company.kpp && (
              <div>
                <dt className="text-sm text-secondary-500">КПП</dt>
                <dd className="text-secondary-900 font-mono">{company.kpp}</dd>
              </div>
            )}
            {company.ogrn && (
              <div>
                <dt className="text-sm text-secondary-500">ОГРН</dt>
                <dd className="text-secondary-900 font-mono">{company.ogrn}</dd>
              </div>
            )}
            {company.legal_address && (
              <div>
                <dt className="text-sm text-secondary-500">Юридический адрес</dt>
                <dd className="text-secondary-900">{company.legal_address}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Банковские реквизиты */}
        {isOwn && (
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Банковские реквизиты
            </h3>
            <dl className="space-y-3">
              {company.bank_name && (
                <div>
                  <dt className="text-sm text-secondary-500">Наименование банка</dt>
                  <dd className="text-secondary-900">{company.bank_name}</dd>
                </div>
              )}
              {company.bik && (
                <div>
                  <dt className="text-sm text-secondary-500">БИК</dt>
                  <dd className="text-secondary-900 font-mono">{company.bik}</dd>
                </div>
              )}
              {company.checking_account && (
                <div>
                  <dt className="text-sm text-secondary-500">Расчетный счет</dt>
                  <dd className="text-secondary-900 font-mono">{company.checking_account}</dd>
                </div>
              )}
              {company.correspondent_account && (
                <div>
                  <dt className="text-sm text-secondary-500">Корр. счет</dt>
                  <dd className="text-secondary-900 font-mono">{company.correspondent_account}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {!isOwn && (
        <div className="bg-secondary-50 rounded-lg p-4 text-sm text-secondary-600">
          💡 Полные реквизиты доступны после установления контакта с компанией
        </div>
      )}
    </div>
  );
}

export default DetailsTab;
```

### 9. Вкладка "Статистика"

**src/components/company/StatsTab.jsx**
```jsx
function StatsTab({ company }) {
  const stats = [
    {
      label: 'Просмотров профиля',
      value: company.stats?.views || 0,
      icon: '👁️',
      trend: '+12%',
    },
    {
      label: 'Кликов на контакты',
      value: company.stats?.contact_clicks || 0,
      icon: '📞',
      trend: '+5%',
    },
    {
      label: 'Появлений в поиске',
      value: company.stats?.search_appearances || 0,
      icon: '🔍',
      trend: '+8%',
    },
    {
      label: 'Сохранений в избранное',
      value: company.stats?.favorites || 0,
      icon: '⭐',
      trend: '+3%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-sm text-success font-medium">
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-secondary-900 mb-1">
              {stat.value.toLocaleString('ru-RU')}
            </div>
            <div className="text-sm text-secondary-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          📊 Активность за последние 30 дней
        </h3>
        <p className="text-secondary-600">
          График активности будет реализован в следующей версии
        </p>
      </div>
    </div>
  );
}

export default StatsTab;
```

## Критерии приёмки
- [ ] Компонент Tabs реализован и переиспользуем
- [ ] 5 вкладок созданы (О компании, Я ПРОДАЮ, Я ПОКУПАЮ, Реквизиты, Статистика)
- [ ] Переключение между вкладками работает
- [ ] Редактирование информации в вкладках работает (для своей компании)
- [ ] CRUD операции для продуктов/услуг работают
- [ ] Иконки и badges на вкладках отображаются
- [ ] Responsive дизайн работает
- [ ] Различие между своим и чужим профилем реализовано
- [ ] Статистика отображается только для своей компании

## Зависимости
- Задача 01-tailwind-setup
- Задача 02-redux-setup
- Задача 03-company-crud (backend)
- Задача 04-products-crud (backend)

## Приоритет
Высокий (P1)

## Оценка времени
4-5 дней

## Примечания
Вкладки делают профиль более организованным и улучшают UX за счет группировки связанной информации.

