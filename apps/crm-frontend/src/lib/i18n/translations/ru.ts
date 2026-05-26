/** Russian translations for CRM UI. */

import type { Translations } from "./en";

const ru: Translations = {
  // ── Navigation ──────────────────────────────────────────────────
  nav: {
    dashboard: "Панель",
    contacts: "Контакты",
    companies: "Компании",
    deals: "Сделки",
    activities: "Активность",
    settings: "Настройки",
  },

  // ── Common UI ───────────────────────────────────────────────────
  common: {
    search: "Поиск...",
    save: "Сохранить",
    cancel: "Отмена",
    create: "Создать",
    edit: "Редактировать",
    delete: "Удалить",
    confirm: "Подтвердить",
    previous: "Назад",
    next: "Вперёд",
    loading: "Загрузка...",
    noResults: "Ничего не найдено.",
    showing: "Показано",
    of: "из",
    all: "Все",
    none: "—",
    actions: "Действия",
    clear: "Очистить",
    close: "Закрыть",
    back: "Назад",
    error: "Ошибка",
    success: "Успешно",
    required: "Обязательно",
  },

  // ── Dashboard ───────────────────────────────────────────────────
  dashboard: {
    title: "Панель",
    description: "Обзор CRM",
    totalContacts: "Всего контактов",
    totalCompanies: "Всего компаний",
    totalDeals: "Всего сделок",
    totalActivities: "Всего активностей",
    recentActivities: "Последние активности",
    recentDeals: "Последние сделки",
    noData: "Нет данных",
  },

  // ── Contacts ────────────────────────────────────────────────────
  contacts: {
    title: "Контакты",
    description: "{count} контактов",
    noDescription: "Управление контактами",
    searchPlaceholder: "Поиск контактов по имени или email...",
    name: "Имя",
    email: "Email",
    title_field: "Должность",
    company: "Компания",
    created: "Создан",
    addContact: "Добавить контакт",
    newContact: "Новый контакт",
    editContact: "Редактировать контакт",
    noContacts: "Контактов пока нет",
    noContactsDesc: "Создайте первый контакт, чтобы начать.",
    contactCreated: 'Контакт "{name}" создан',
    contactDeleted: 'Контакт "{name}" удалён',
    contactUpdated: 'Контакт "{name}" обновлён',
    createError: "Не удалось создать контакт",
    deleteError: "Не удалось удалить контакт",
    loadError: "Не удалось загрузить контакты",
    loadErrorDetail: "Произошла непредвиденная ошибка",
  },

  // ── Companies ───────────────────────────────────────────────────
  companies: {
    title: "Компании",
    description: "{count} компаний",
    noDescription: "Управление компаниями",
    searchPlaceholder: "Поиск компаний по названию или отрасли...",
    name: "Название",
    industry: "Отрасль",
    size: "Размер",
    website: "Сайт",
    created: "Создана",
    allIndustries: "Все отрасли",
    addCompany: "Добавить компанию",
    newCompany: "Новая компания",
    editCompany: "Редактировать компанию",
    noCompanies: "Компаний пока нет",
    noCompaniesDesc:
      "Создайте первую компанию для отслеживания отношений, сделок и контактов.",
    companyCreated: 'Компания "{name}" создана',
    companyDeleted: 'Компания "{name}" удалена',
    createError: "Не удалось создать компанию",
    deleteError: "Не удалось удалить компанию",
    loadError: "Не удалось загрузить компании",
  },

  // ── Deals ───────────────────────────────────────────────────────
  deals: {
    title: "Сделки",
    description: "{count} сделок",
    noDescription: "Управление сделками и воронкой",
    searchPlaceholder: "Поиск сделок по названию...",
    name: "Название",
    amount: "Сумма",
    stage: "Этап",
    contact: "Контакт",
    company: "Компания",
    closeDate: "Дата закрытия",
    allStages: "Все этапы",
    addDeal: "Добавить сделку",
    newDeal: "Новая сделка",
    editDeal: "Редактировать сделку",
    noDeals: "Сделок пока нет",
    noDealsDesc: "Создайте первую сделку для отслеживания воронки.",
    dealCreated: 'Сделка "{name}" создана',
    dealDeleted: 'Сделка "{name}" удалена',
    createError: "Не удалось создать сделку",
    deleteError: "Не удалось удалить сделку",
    loadError: "Не удалось загрузить сделки",
  },

  // ── Activities ──────────────────────────────────────────────────
  activities: {
    title: "Активность",
    description: "{count} активностей",
    noDescription: "Отслеживание активности команды",
    searchPlaceholder: "Поиск активностей по теме...",
    type: "Тип",
    subject: "Тема",
    descField: "Описание",
    contact: "Контакт",
    deal: "Сделка",
    date: "Дата",
    allTypes: "Все типы",
    addActivity: "Добавить активность",
    newActivity: "Новая активность",
    editActivity: "Редактировать активность",
    noActivities: "Активностей пока нет",
    noActivitiesDesc: "Запишите первую активность для отслеживания работы команды.",
    activityCreated: 'Активность "{name}" создана',
    createError: "Не удалось создать активность",
  },

  // ── Settings ────────────────────────────────────────────────────
  settings: {
    title: "Настройки",
    description: "Управление настройками и учётной записью.",
    organization: "Организация",
    organizationDesc: "Данные вашей организации",
    appearance: "Оформление",
    appearanceDesc: "Выберите предпочитаемую тему",
    profile: "Профиль",
    profileDesc: "Информация об учётной записи",
    language: "Язык",
    languageDesc: "Выберите предпочитаемый язык",
    english: "English",
    russian: "Русский",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    themeSystem: "Системная",
    themeSystemDesc: "Тема соответствует системным настройкам.",
    themeDarkDesc: "Включена тёмная тема.",
    themeLightDesc: "Включена светлая тема.",
    member: "Участник",
    activeSession: "Активная сессия",
    orgId: "ID организации",
    slug: "Slug",
    activeAccount: "Активный аккаунт",
    orgLoadError: "Не удалось загрузить организацию",
    orgLoadErrorDetail: "Данные организации временно недоступны.",
    user: "Пользователь CRM",
  },

  // ── Auth / Login ────────────────────────────────────────────────
  auth: {
    loginTitle: "Добро пожаловать в CRM",
    loginSubtitle: "Войдите в рабочее пространство",
    loginButton: "Войти",
    loginLoading: "Вход...",
    loginError: "Неверные учётные данные",
    loginErrorDetail: "Проверьте email и пароль.",
    logout: "Выйти",
  },

  // ── Deal Stages ─────────────────────────────────────────────────
  dealStages: {
    new: "Новая",
    discovery: "Изучение",
    proposal: "Предложение",
    negotiation: "Переговоры",
    closed_won: "Закрыта (успех)",
    closed_lost: "Закрыта (проигрыш)",
  },

  // ── Activity Types ──────────────────────────────────────────────
  activityTypes: {
    call: "Звонок",
    email: "Email",
    meeting: "Встреча",
    note: "Заметка",
    task: "Задача",
    follow_up: "Повтор",
  },

  // ── Forms / Validation ──────────────────────────────────────────
  forms: {
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    address: "Адрес",
    website: "Сайт",
    amount: "Сумма",
    expectedCloseDate: "Ожидаемая дата закрытия",
    status: "Статус",
    active: "Активен",
    inactive: "Неактивен",
    deleteConfirmTitle: "Вы уверены?",
    deleteConfirmDesc: "Это действие нельзя отменить.",
    openRowActions: "Открыть действия строки",
    selectAll: "Выбрать все строки",
    selectRow: "Выбрать строку {row}",
  },

  // ── Formatting ──────────────────────────────────────────────────
  formatting: {
    currency: "RUB",
    locale: "ru-RU",
  },
};

export default ru;
