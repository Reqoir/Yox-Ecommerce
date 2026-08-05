import 'dotenv/config';
import mongoose from 'mongoose';
import { GetDashboardStatsUseCase } from './src/modules/analytics/application/use-cases/get-dashboard-stats.use-case';
import { GetSalesChartUseCase } from './src/modules/analytics/application/use-cases/get-sales-chart.use-case';

async function testAnalytics() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected.');

    const statsUseCase = new GetDashboardStatsUseCase();
    const chartUseCase = new GetSalesChartUseCase();

    console.log('\n--- Fetching Dashboard Stats ---');
    const stats = await statsUseCase.execute();
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n--- Fetching Sales Chart (30 Days) ---');
    const chart = await chartUseCase.execute(30);
    console.log(`Returned ${chart.length} days of data. First 3 days:`);
    console.log(JSON.stringify(chart.slice(0, 3), null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

testAnalytics();
