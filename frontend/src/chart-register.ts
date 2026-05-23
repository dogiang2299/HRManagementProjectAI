import {
  Chart,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  Decimation,
  TimeSeriesScale
} from "chart.js";

Chart.register(
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  Decimation,
  TimeSeriesScale
);
