# EduCRM — React Frontend

## Ishga tushirish

```bash
cd crm-react
npm install
npm start
```

## Backend URL o'zgartirish

`.env` faylida:
```
REACT_APP_API_URL=http://your-backend-url/api
```

## Sahifalar va Rollar

| Sahifa | ADMIN | MANAGER | OPERATOR |
|--------|-------|---------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Foydalanuvchilar | ✅ | ❌ | ❌ |
| O'quvchilar | ✅ | ✅ | ✅ |
| Ro'yxatga olish | ✅ | ✅ | ✅ |
| To'lovlar | ✅ | ✅ | ✅ |
| Kurslar | ✅ | ✅ | ✅ |
| Guruhlar | ✅ | ✅ | ✅ |
| Darslar | ✅ | ✅ | ❌ |
| Davomat | ✅ | ✅ | ✅ |
| Harajatlar | ✅ | ✅ | ❌ |

## Asosiy o'zgartirishlar (oldingi versiyaga nisbatan)

- ✅ Login ishlaydigan qilib to'g'rilandi (backend `result` field to'g'ri o'qiladi)
- ✅ Lid, O'qituvchi, Oylik bo'limlari olib tashlandi
- ✅ Premium dizayn — Plus Jakarta Sans, CSS Design System
- ✅ Barcha import va API chaqiruvlar tekshirildi
- ✅ `key={page}` — sahifa o'zgarganda komponent qayta yuklanadi
- ✅ Token `crm_token`, user `crm_user` sifatida saqlanadi

## Loyiha tuzilmasi

```
src/
├── App.jsx              — Sidebar, routing, rol boshqaruvi
├── index.css            — Premium design system (CSS variables)
├── api/index.js         — Barcha API chaqiruvlar + getResult helper
├── hooks/
│   ├── useAuth.js       — Login/logout state
│   └── useToast.js      — Toast bildirishnomalar
├── utils/index.js       — money(), dateStr(), badge helpers
├── components/UI.jsx    — Modal, Table, Badge, Spinner, FormGroup...
└── pages/
    ├── LoginPage.jsx
    ├── Dashboard.jsx
    ├── UsersPage.jsx
    ├── OperatorPages.jsx     — Students + Enrollments + Payments
    ├── AcademicPages.jsx     — Courses + Groups
    ├── LessonAttendancePages.jsx — Lessons + Attendance
    └── ExpensesPage.jsx
```
