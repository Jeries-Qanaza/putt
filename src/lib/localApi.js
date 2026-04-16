import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const STORAGE_KEY = 'putt-standalone-data';

const createSchedule = (open, close, closed = false) => ({
  open,
  close,
  closed,
});

const defaultSchedule = {
  Sun: createSchedule('08:00', '22:00'),
  Mon: createSchedule('08:00', '22:00'),
  Tue: createSchedule('08:00', '22:00'),
  Wed: createSchedule('08:00', '22:00'),
  Thu: createSchedule('08:00', '23:00'),
  Fri: createSchedule('09:00', '23:30'),
  Sat: createSchedule('09:00', '23:30'),
};

const seedData = {
  Restaurant: [
    {
      id: 'rest-1',
      created_date: '2026-04-01T09:00:00.000Z',
      updated_date: '2026-04-01T09:00:00.000Z',
      name: 'Putt Cafe',
      name_he: 'פאט קפה',
      name_ar: 'بوت كافيه',
      description: 'A bright all-day cafe with breakfast, salads, and specialty coffee.',
      description_he: 'בית קפה קליל לכל היום עם ארוחות בוקר, סלטים וקפה מיוחד.',
      description_ar: 'مقهى مريح طوال اليوم مع فطور وسلطات وقهوة مميزة.',
      address: '12 Market Street, Haifa',
      latitude: 32.794,
      longitude: 34.99,
      phone: '+972-4-555-0101',
      schedule: defaultSchedule,
      cover_image: '',
      categories: ['Cafe', 'Breakfast'],
      manager_email: 'maya@putt.local',
      manager_name: 'Maya Levi',
      manager_phone: '+972-54-555-0101',
      editor_email: 'putt@putt.local',
      editor_username: 'putt@putt.local',
      editor_password: 'putt123',
      is_active: true,
    },
    {
      id: 'rest-2',
      created_date: '2026-04-02T09:00:00.000Z',
      updated_date: '2026-04-02T09:00:00.000Z',
      name: 'Harbor Grill',
      name_he: 'הארבור גריל',
      name_ar: 'هاربور جريل',
      description: 'Grill house with hearty mains, late-night bites, and a sea view.',
      description_he: 'מסעדת גריל עם מנות עיקריות, נשנושי לילה ונוף לים.',
      description_ar: 'مطعم مشاوي مع أطباق رئيسية ووجبات ليلية وإطلالة على البحر.',
      address: '8 Port Road, Acre',
      latitude: 32.927,
      longitude: 35.081,
      phone: '+972-4-555-0202',
      schedule: defaultSchedule,
      cover_image: '',
      categories: ['Grill', 'Dinner'],
      manager_email: 'omar@putt.local',
      manager_name: 'Omar Nassar',
      manager_phone: '+972-52-555-0202',
      editor_email: 'harbor@putt.local',
      editor_username: 'harbor@putt.local',
      editor_password: 'harbor123',
      is_active: true,
    },
  ],
  Category: [
    { id: 'cat-1', created_date: '2026-04-01T09:00:00.000Z', updated_date: '2026-04-01T09:00:00.000Z', name: 'Cafe', name_he: 'קפה', name_ar: 'مقهى', icon: '☕', sort_order: 1 },
    { id: 'cat-2', created_date: '2026-04-01T09:00:00.000Z', updated_date: '2026-04-01T09:00:00.000Z', name: 'Breakfast', name_he: 'ארוחות בוקר', name_ar: 'فطور', icon: '🍳', sort_order: 2 },
    { id: 'cat-3', created_date: '2026-04-01T09:00:00.000Z', updated_date: '2026-04-01T09:00:00.000Z', name: 'Grill', name_he: 'גריל', name_ar: 'مشاوي', icon: '🔥', sort_order: 3 },
    { id: 'cat-4', created_date: '2026-04-01T09:00:00.000Z', updated_date: '2026-04-01T09:00:00.000Z', name: 'Dinner', name_he: 'ערב', name_ar: 'عشاء', icon: '🍽️', sort_order: 4 },
  ],
  Meal: [
    {
      id: 'meal-1',
      created_date: '2026-04-01T10:00:00.000Z',
      updated_date: '2026-04-01T10:00:00.000Z',
      name: 'Iced Latte',
      name_he: 'אייס לאטה',
      name_ar: 'لاتيه مثلج',
      description: 'Double espresso with cold milk over ice.',
      description_he: 'אספרסו כפול עם חלב קר וקרח.',
      description_ar: 'إسبريسو مزدوج مع حليب بارد وثلج.',
      price: 18,
      image_url: '',
      restaurant_id: 'rest-1',
      menu_category: 'Cold Drinks',
      menu_category_he: 'משקאות קרים',
      menu_category_ar: 'مشروبات باردة',
      dietary_tags: ['vegetarian'],
      status: true,
      is_available: true,
      sort_order: 1,
    },
    {
      id: 'meal-2',
      created_date: '2026-04-01T11:00:00.000Z',
      updated_date: '2026-04-01T11:00:00.000Z',
      name: 'Halloumi Breakfast Plate',
      name_he: 'צלחת בוקר חלומי',
      name_ar: 'طبق فطور حلوم',
      description: 'Eggs, vegetables, halloumi, bread, and dips.',
      description_he: 'ביצים, ירקות, חלומי, לחם ומטבלים.',
      description_ar: 'بيض وخضار وحلوم وخبز وصلصات.',
      price: 48,
      image_url: '',
      restaurant_id: 'rest-1',
      menu_category: 'Breakfast',
      menu_category_he: 'ארוחות בוקר',
      menu_category_ar: 'فطور',
      dietary_tags: ['vegetarian'],
      status: true,
      is_available: true,
      sort_order: 2,
    },
    {
      id: 'meal-3',
      created_date: '2026-04-02T10:00:00.000Z',
      updated_date: '2026-04-02T10:00:00.000Z',
      name: 'Smoked Brisket Plate',
      name_he: 'בריסקט מעושן',
      name_ar: 'طبق بريسكيت مدخن',
      description: 'Slow-cooked brisket with potatoes and roasted peppers.',
      description_he: 'בריסקט בבישול איטי עם תפוחי אדמה ופלפלים קלויים.',
      description_ar: 'بريسكيت مطهو ببطء مع بطاطا وفلفل مشوي.',
      price: 86,
      image_url: '',
      restaurant_id: 'rest-2',
      menu_category: 'Mains',
      menu_category_he: 'עיקריות',
      menu_category_ar: 'الأطباق الرئيسية',
      dietary_tags: ['halal'],
      status: true,
      is_available: true,
      sort_order: 1,
    },
  ],
  Event: [
    {
      id: 'event-1',
      created_date: '2026-04-03T12:00:00.000Z',
      updated_date: '2026-04-03T12:00:00.000Z',
      title: 'Live Jazz Night',
      title_he: 'ערב ג׳אז חי',
      title_ar: 'ليلة جاز حي',
      description: 'An acoustic trio on the terrace.',
      description_he: 'טריו אקוסטי במרפסת.',
      description_ar: 'ثلاثي أكوستيك على الشرفة.',
      date: '2026-04-18',
      time: '20:30',
      image_url: '',
      restaurant_id: 'rest-2',
    },
  ],
  News: [
    {
      id: 'news-1',
      created_date: '2026-04-05T08:00:00.000Z',
      updated_date: '2026-04-05T08:00:00.000Z',
      title: 'Morning Combo',
      title_he: 'קומבו בוקר',
      title_ar: 'عرض الصباح',
      body: 'Coffee and pastry for 22 ILS until 11:00.',
      body_he: 'קפה ומאפה ב-22 ש"ח עד 11:00.',
      body_ar: 'قهوة ومعجنات مقابل 22 شيكل حتى 11:00.',
      emoji: '🥐',
      type: 'coupon',
      restaurant_id: 'rest-1',
      is_active: true,
      expires_at: '2026-12-31',
      date: '',
      time: '',
      image_url: '',
    },
  ],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const tableMap = {
  Restaurant: 'restaurants',
  Category: 'categories',
  Meal: 'meals',
  Event: 'events',
  News: null,
  DietaryTag: 'dietary_tags',
};

const sortFieldMap = {
  Restaurant: {
    name: 'name_en',
    description: 'description_en',
  },
  Category: {
    name: 'name_en',
  },
  DietaryTag: {
    name: 'name',
  },
  Meal: {
    name: 'meal_name_en',
    description: 'meal_description_en',
    sort_order: 'created_at',
  },
  Event: {
    title: 'title_en',
    description: 'description_en',
  },
  News: {
    title: 'title_en',
    body: 'body_en',
  },
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeSortValue = (value) => {
  if (value == null) return '';
  return typeof value === 'string' ? value.toLowerCase() : value;
};

const sortItems = (items, sortBy) => {
  if (!sortBy) return items;
  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;

  return [...items].sort((a, b) => {
    const left = normalizeSortValue(a[field]);
    const right = normalizeSortValue(b[field]);

    if (left < right) return descending ? 1 : -1;
    if (left > right) return descending ? -1 : 1;
    return 0;
  });
};

const matches = (item, criteria = {}) =>
  Object.entries(criteria).every(([key, value]) => item[key] === value);

const createId = (entityName) =>
  `${entityName.toLowerCase()}-${Math.random().toString(36).slice(2, 10)}`;

const loadState = () => {
  if (!isBrowser()) return clone(seedData);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = clone(seedData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const seeded = clone(seedData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const saveState = (state) => {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

const readCollection = (entityName) => loadState()[entityName] || [];

const writeCollection = (entityName, updater) => {
  const state = loadState();
  const current = state[entityName] || [];
  state[entityName] = updater(current);
  saveState(state);
  return state[entityName];
};

const getTableName = (entityName) =>
  Object.prototype.hasOwnProperty.call(tableMap, entityName)
    ? tableMap[entityName]
    : entityName.toLowerCase();
const remoteEntityDisabled = new Set();
const unsupportedRemoteFields = new Map();

const getUnsupportedFieldSet = (entityName) => {
  if (!unsupportedRemoteFields.has(entityName)) {
    unsupportedRemoteFields.set(entityName, new Set());
  }

  return unsupportedRemoteFields.get(entityName);
};

const omitUnsupportedRemoteFields = (entityName, payload) => {
  const unsupportedFields = getUnsupportedFieldSet(entityName);

  if (!unsupportedFields.size || !payload || typeof payload !== 'object') {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([field]) => !unsupportedFields.has(field))
  );
};

const getMissingColumnName = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  const match = message.match(/'([^']+)' column/i);
  return match?.[1] || null;
};

const retryWithoutMissingColumns = async (entityName, payload, executor) => {
  let candidatePayload = omitUnsupportedRemoteFields(entityName, payload);

  for (;;) {
    try {
      return await executor(candidatePayload);
    } catch (error) {
      const missingColumn = getMissingColumnName(error);

      if (!missingColumn || !(missingColumn in candidatePayload)) {
        throw error;
      }

      getUnsupportedFieldSet(entityName).add(missingColumn);
      candidatePayload = omitUnsupportedRemoteFields(entityName, candidatePayload);
    }
  }
};

const mapFieldName = (entityName, field) => {
  if (!field) return field;
  return sortFieldMap[entityName]?.[field] || field;
};

const serializeRestaurantPayload = (payload) => ({
  address: payload.address ?? '',
  categories: payload.categories ?? [],
  cover_image: payload.cover_image ?? '',
  description_ar: payload.description_ar ?? '',
  description_en: payload.description ?? payload.description_en ?? '',
  description_he: payload.description_he ?? '',
  editor_password: payload.editor_password ?? '',
  is_active: payload.is_active ?? true,
  latitude: payload.latitude ?? null,
  logo_url: payload.logo_url ?? '',
  longitude: payload.longitude ?? null,
  manager_email: payload.manager_email ?? '',
  manager_name: payload.manager_name ?? '',
  manager_phone: payload.manager_phone ?? '',
  editor_email: payload.editor_email ?? payload.editor_username ?? '',
  name_ar: payload.name_ar ?? '',
  name_en: payload.name ?? payload.name_en ?? '',
  name_he: payload.name_he ?? '',
  phone: payload.phone ?? '',
  schedule: payload.schedule ?? null,
  editor_username: payload.editor_email ?? payload.editor_username ?? '',
});

const serializeMealPayload = (payload) => ({
  meal_name_en: payload.name ?? payload.meal_name_en ?? '',
  meal_name_he: payload.name_he ?? payload.meal_name_he ?? '',
  meal_name_ar: payload.name_ar ?? payload.meal_name_ar ?? '',
  meal_description_en: payload.description ?? payload.meal_description_en ?? '',
  meal_description_he: payload.description_he ?? payload.meal_description_he ?? '',
  meal_description_ar: payload.description_ar ?? payload.meal_description_ar ?? '',
  price: payload.price ?? null,
  image_url: payload.image_url ?? '',
  restaurant_id: payload.restaurant_id ?? null,
  menu_category: payload.menu_category ?? '',
  dietary_tags: payload.dietary_tags ?? [],
  is_available: payload.is_available ?? payload.status ?? true,
  is_featured: payload.is_featured ?? false,
});

const serializeCategoryPayload = (payload) => ({
  ...payload,
  name_en: payload.name ?? payload.name_en ?? '',
});

const serializeEventPayload = (payload) => ({
  ...payload,
  title_en: payload.title ?? payload.title_en ?? '',
  description_en: payload.description ?? payload.description_en ?? '',
});

const serializeEntityPayload = (entityName, payload) => {
  switch (entityName) {
    case 'Restaurant':
      return serializeRestaurantPayload(payload);
    case 'Meal':
      return serializeMealPayload(payload);
    case 'Category':
      return serializeCategoryPayload(payload);
    case 'Event':
      return serializeEventPayload(payload);
    default:
      return payload;
  }
};

const normalizeRestaurant = (row) => ({
  ...row,
  name: row.name ?? row.name_en ?? '',
  description: row.description ?? row.description_en ?? '',
  description_he: row.description_he ?? '',
  description_ar: row.description_ar ?? '',
  logo_url: row.logo_url ?? '',
  editor_email: row.editor_email ?? row.editor_username ?? '',
  schedule: normalizeSchedule(row.schedule),
});

const normalizeCategory = (row) => ({
  ...row,
  name: row.name ?? row.name_en ?? '',
});

const normalizeMeal = (row) => ({
  ...row,
  name: row.name ?? row.meal_name_en ?? '',
  name_he: row.name_he ?? row.meal_name_he ?? '',
  name_ar: row.name_ar ?? row.meal_name_ar ?? '',
  description: row.description ?? row.meal_description_en ?? '',
  description_he: row.description_he ?? row.meal_description_he ?? '',
  description_ar: row.description_ar ?? row.meal_description_ar ?? '',
  status: row.status ?? row.is_available ?? true,
  is_available: row.is_available ?? row.status ?? true,
});

const normalizeEvent = (row) => ({
  ...row,
  title: row.title ?? row.title_en ?? '',
  description: row.description ?? row.description_en ?? '',
});

const normalizeNews = (row) => ({
  ...row,
  title: row.title ?? row.title_en ?? '',
  body: row.body ?? row.body_en ?? '',
});

const normalizeDietaryTag = (row) => ({
  ...row,
  name: row.name ?? '',
  icon: row.icon ?? '',
});

const normalizeEntityRow = (entityName, row) => {
  if (!row) return row;
  switch (entityName) {
    case 'Restaurant':
      return normalizeRestaurant(row);
    case 'Category':
      return normalizeCategory(row);
    case 'Meal':
      return normalizeMeal(row);
    case 'Event':
      return normalizeEvent(row);
    case 'News':
      return normalizeNews(row);
    case 'DietaryTag':
      return normalizeDietaryTag(row);
    default:
      return row;
  }
};

const normalizeEntityRows = (entityName, rows) => (rows || []).map((row) => normalizeEntityRow(entityName, row));

function normalizeSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return schedule;

  const dayMap = {
    Sunday: 'Sun',
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sun: 'Sun',
    Mon: 'Mon',
    Tue: 'Tue',
    Wed: 'Wed',
    Thu: 'Thu',
    Fri: 'Fri',
    Sat: 'Sat',
  };

  return Object.entries(schedule).reduce((acc, [rawDay, value]) => {
    const day = dayMap[rawDay] || rawDay;
    const firstEntry = Array.isArray(value) ? value[0] : value;

    if (!firstEntry || typeof firstEntry !== 'object') {
      return acc;
    }

    acc[day] = {
      open: firstEntry.open || '',
      close: firstEntry.close || '',
      closed: firstEntry.closed ?? false,
    };

    return acc;
  }, {});
}

const shouldFallbackToLocal = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    message.includes('column') ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('jwt') ||
    message.includes('not found')
  );
};

const runSupabase = async (entityName, callback, options = {}) => {
  if (!isSupabaseConfigured) return null;
  if (remoteEntityDisabled.has(entityName)) return null;

  const tableName = getTableName(entityName);
  if (!tableName) return null;

  try {
    return await callback(supabase.from(tableName));
  } catch (error) {
    if (!options.allowFallback) {
      throw error;
    }
    if (shouldFallbackToLocal(error)) {
      remoteEntityDisabled.add(entityName);
      return null;
    }
    throw error;
  }
};

const createEntityApi = (entityName) => ({
  async list(sortBy) {
    const remoteData = await runSupabase(entityName, async (table) => {
      let query = table.select('*');

      if (sortBy) {
        const descending = sortBy.startsWith('-');
        const rawField = descending ? sortBy.slice(1) : sortBy;
        const field = mapFieldName(entityName, rawField);
        query = query.order(field, { ascending: !descending });
      }

      const { data, error } = await query;
      if (error) throw error;
      return normalizeEntityRows(entityName, data);
    });

    if (remoteData) {
      return remoteData;
    }

    return clone(sortItems(readCollection(entityName), sortBy));
  },

  async filter(criteria, sortBy) {
    const remoteData = await runSupabase(entityName, async (table) => {
      let query = table.select('*');

      Object.entries(criteria || {}).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (sortBy) {
        const descending = sortBy.startsWith('-');
        const rawField = descending ? sortBy.slice(1) : sortBy;
        const field = mapFieldName(entityName, rawField);
        query = query.order(field, { ascending: !descending });
      }

      const { data, error } = await query;
      if (error) throw error;
      return normalizeEntityRows(entityName, data);
    });

    if (remoteData) {
      return remoteData;
    }

    const filtered = readCollection(entityName).filter((item) => matches(item, criteria));
    return clone(sortItems(filtered, sortBy));
  },

  async create(payload) {
    const normalizedPayload =
      entityName === 'Meal'
        ? {
            ...payload,
            status: payload.status ?? payload.is_available ?? true,
            is_available: payload.is_available ?? payload.status ?? true,
          }
        : payload;
    const serializedPayload = serializeEntityPayload(entityName, normalizedPayload);

    const remoteData = await runSupabase(entityName, async (table) => {
      const executeInsert = async (candidatePayload) => {
        const { data, error } = await table.insert(candidatePayload).select().single();
        if (error) throw error;
        return normalizeEntityRow(entityName, data);
      };
      return retryWithoutMissingColumns(entityName, serializedPayload, executeInsert);
    }, { allowFallback: false });

    if (remoteData) {
      return remoteData;
    }

    const now = new Date().toISOString();
    const record = {
      id: createId(entityName),
      created_date: now,
      updated_date: now,
      ...normalizedPayload,
    };

    writeCollection(entityName, (items) => [...items, record]);
    return clone(record);
  },

  async update(id, payload) {
    const normalizedPayload =
      entityName === 'Meal'
        ? {
            ...payload,
            status: payload.status ?? payload.is_available ?? true,
            is_available: payload.is_available ?? payload.status ?? true,
          }
        : payload;
    const serializedPayload = serializeEntityPayload(entityName, normalizedPayload);

    const remoteData = await runSupabase(entityName, async (table) => {
      const executeUpdate = async (candidatePayload) => {
        const { data, error } = await table
          .update(candidatePayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return normalizeEntityRow(entityName, data);
      };
      return retryWithoutMissingColumns(entityName, serializedPayload, executeUpdate);
    }, { allowFallback: false });

    if (remoteData) {
      return remoteData;
    }

    const now = new Date().toISOString();
    let updatedRecord = null;

    writeCollection(entityName, (items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        updatedRecord = { ...item, ...normalizedPayload, id, updated_date: now };
        return updatedRecord;
      })
    );

    if (!updatedRecord) {
      throw new Error(`${entityName} "${id}" not found.`);
    }

    return clone(updatedRecord);
  },

  async delete(id) {
    const remoteData = await runSupabase(entityName, async (table) => {
      const { data, error } = await table.delete().eq('id', id).select().single();
      if (error) throw error;
      return normalizeEntityRow(entityName, data);
    }, { allowFallback: false });

    if (remoteData) {
      return remoteData;
    }

    let deletedRecord = null;

    writeCollection(entityName, (items) =>
      items.filter((item) => {
        if (item.id === id) {
          deletedRecord = item;
          return false;
        }
        return true;
      })
    );

    return clone(deletedRecord);
  },
});

const USER_STORAGE_KEY = 'putt-standalone-user';

export const localAuth = {
  getUser() {
    if (!isBrowser()) {
      return { id: 'local-admin', name: 'Local Admin', role: 'admin' };
    }

    const existing = window.localStorage.getItem(USER_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }

    const fallbackUser = { id: 'local-admin', name: 'Local Admin', role: 'admin' };
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  setUser(user) {
    if (isBrowser()) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  clearUser() {
    if (isBrowser()) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  },
};

export const localApi = {
  entities: {
    Restaurant: createEntityApi('Restaurant'),
    Category: createEntityApi('Category'),
    Meal: createEntityApi('Meal'),
    Event: createEntityApi('Event'),
    News: createEntityApi('News'),
    DietaryTag: createEntityApi('DietaryTag'),
  },
};
