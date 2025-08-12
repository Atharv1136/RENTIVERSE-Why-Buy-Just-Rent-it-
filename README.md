onnection string: `postgresql://username:password@localhost:5432/rentiverse`

3. **⚙️ Environment Configuration**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your database URL
   DATABASE_URL=your_database_connection_string
   SESSION_SECRET=your_secret_key
   ```

4. **🔄 Database Migration**
   ```bash
   npm run db:push
   ```

5. **🚀 Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5000 🌐

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `SESSION_SECRET` | Secret key for sessions | ✅ Yes |
| `EMAIL_USER` | Gmail address for OTP emails | ❌ No |
| `EMAIL_PASSWORD` | Gmail app password | ❌ No |
| `RAZORPAY_KEY_ID` | Razorpay API key | ❌ No |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | ❌ No |

## 📜 Scripts

- `npm run dev` - Start development server 🔥
- `npm run build` - Build for production 📦
- `npm run start` - Start production server 🚀
- `npm run db:push` - Push schema changes to database 🔄
- `npm run check` - Type checking ✅

## ✨ Features

- 🔐 User authentication with email verification
- 📦 Product catalog management
- 📋 Order and rental tracking
- 💳 Payment integration with Razorpay
- 👨‍💼 Admin dashboard
- 🔔 Real-time notifications

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui ⚛️
- **Backend**: Express.js, TypeScript 🖥️
- **Database**: PostgreSQL with Drizzle ORM 🗄️
- **Authentication**: Passport.js with sessions 🔐
- **Payments**: Razorpay integration 💳
- **Email**: Nodemailer for OTP verification 📧
