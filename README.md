# 📊 Portfolio Tracker

A modern, professional portfolio tracking application with real-time Google Finance integration.

![Portfolio Tracker](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

- **Real-time Stock Tracking**: Monitor your investments with live price data from Google Finance
- **Portfolio Metrics**: Track total value, gains/losses, and daily performance
- **Interactive Charts**: Visualize asset allocation with beautiful pie charts
- **Dark Mode**: Professional fintech UI with full dark/light mode support
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Type-Safe**: Built with TypeScript for reliability and maintainability

## 📸 Screenshots

### Dashboard (Light Mode)
*Professional summary cards showing total portfolio value, gains/losses, and today's performance*

### Dashboard (Dark Mode)
*Sleek dark theme optimized for extended viewing sessions*

### Holdings Table
*Detailed view of all assets with real-time prices, quantities, and profit/loss calculations*

### Asset Allocation
*Interactive pie chart showing portfolio distribution across different holdings*

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes
- **Data Source**: Google Finance

## 📦 Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd "W:\Pos Project\Portfolio Tracker"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
portfolio-tracker/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── holdings/      # Holdings CRUD
│   │   └── prices/        # Price fetching
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard-summary.tsx
│   ├── asset-table.tsx
│   ├── allocation-chart.tsx
│   └── refresh-button.tsx
├── lib/                   # Utility libraries
│   ├── data-store.ts     # Data persistence
│   ├── calculations.ts   # Portfolio calculations
│   └── google-finance.ts # Price fetching
├── types/                 # TypeScript types
└── data/                  # JSON data storage
    └── holdings.json
```

## 💡 Usage

### Viewing Your Portfolio

1. **Dashboard Overview**: See your total portfolio value, gains/losses, and today's performance at a glance
2. **Holdings Table**: Review detailed information about each asset including current price, quantity, and individual P/L
3. **Allocation Chart**: Understand your portfolio distribution with an interactive pie chart

### Refreshing Prices

Click the **"Refresh Prices"** button in the header to fetch the latest stock prices from Google Finance.

### Dark Mode

Toggle between light and dark modes using the sun/moon icon in the header.

### Adding Holdings

Currently, holdings are managed via the `data/holdings.json` file. To add a new holding:

```json
{
  "id": "5",
  "ticker": "AMZN",
  "name": "Amazon.com Inc.",
  "quantity": 20,
  "purchasePrice": 178.25,
  "purchaseDate": "2024-04-15"
}
```

## 🎨 Customization

### Adding New Tickers

Edit `data/holdings.json` to add more stocks to your portfolio.

### Changing Colors

Modify `app/globals.css` to customize the color scheme:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --success: 142.1 76.2% 36.3%;
  /* ... more colors */
}
```

### Google Finance Integration

For production use with real-time prices:

1. Set up Google Cloud Project
2. Enable Google Sheets API
3. Create a service account
4. Update `lib/google-finance.ts` to use Sheets API

See the [walkthrough documentation](./walkthrough.md) for detailed instructions.

## 📊 Portfolio Calculations

- **Current Value**: `quantity × currentPrice`
- **Gain/Loss**: `currentValue - (quantity × purchasePrice)`
- **Gain/Loss %**: `(gainLoss / costBasis) × 100`
- **Today's Change**: `Σ(quantity × dailyPriceChange)`
- **Allocation**: `(holdingValue / totalValue) × 100`

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Environment Variables

For Google Sheets API integration:

```env
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key
```

## 🔄 Future Enhancements

- [ ] Add/edit/delete holdings via UI
- [ ] Historical performance charts
- [ ] Multi-user support with authentication
- [ ] Real-time Google Sheets API integration
- [ ] Price alerts and notifications
- [ ] Export to PDF/CSV
- [ ] Tax lot tracking
- [ ] Dividend tracking

## 📝 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Data from [Google Finance](https://www.google.com/finance/)

---

**Portfolio Tracker** - Track your investments with confidence 📈
