/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Card,
  DatePicker,
  Dropdown,
  Image,
  message,
  Select,
  Skeleton,
  Tabs,
  TabsProps,
} from "antd";
import { kresusAssets } from "assets";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import useApiClient from "hooks/useApiClient";
import base from "../../../assets/allAssets/base.png";
import solanaa from "../../../assets/allAssets/solanaa.png";
import worldchain from "../../../assets/allAssets/worldchain.png";
import AnalyticsHolding from "./analyticsHolding";
import TransactionAnalytics from "./transactionAnalytics";
import VolumeAnalytics from "./volumeAnalytics";
import "./index.css";

const { Option } = Select;

interface VolumeItem {
  chain: string;
  total_volume: string;
  sent_volume: string;
  received_volume: string;
  swapped_volume: string;
}

interface TransactionItem {
  chain: string;
  total_transaction: number;
  sent_transaction: number;
  received_transaction: number;
  swapped_transaction: number;
}

interface ActiveUserResponse {
  monthlyActiveUsers: number;
  weeklyActiveUsers: number;
  dailyActiveUsers: number;
  filteredActiveUsers: number;
}

interface EarnItem {
  token_in?: string;
  token_out?: string;
  count: string;
  total_deposit?: string;
  total_withdraw?: string;
}

interface EarnResponse {
  deposit: EarnItem[];
  withdraw: EarnItem[];
}

interface FormState {
  chain?: string;
  address?: string;
  start_date?: string;
  end_date?: string;
}

const chainOptions = [
  { label: "Solana Mainnet", value: "solana-mainnet" },
  { label: "Base Mainnet", value: "base-mainnet" },
  { label: "WorldChain Mainnet", value: "worldchain-mainnet" },
];

const addressOptions = [
  { label: "Select Your Address", value: "" },
  {
    label: "0x10d543e2e0355e36c5cab769df8d2d60abb77a73",
    value: "0x10d543e2e0355e36c5cab769df8d2d60abb77a73",
  },
  {
    label: "0x20d543e2e0355e36c5cab769df8d2d60abb77a73",
    value: "0x20d543e2e0355e36c5cab769df8d2d60abb77a73",
  },
  {
    label: "0x20d543e2e0355e36c5cab769df8d2d60abb77a74",
    value: "0x20d543e2e0355e36c5cab769df8d2d60abb77a74",
  },
];

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

const MonthlyActive = () => {
  const [form, setForm] = useState<FormState>({});
  const [activeTab, setActiveTab] = useState<string>("active");
  const { useGetRequest } = useApiClient();
  const vaultURL = import.meta.env.VITE_REACT_APPLICATION_VAULT_URL;

  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: "start_date" | "end_date", date: Dayjs | null) => {
    const newDate = date ? date.format("YYYY-MM-DD") : undefined;
    setForm((prev) => ({ ...prev, [name]: newDate }));
  };

  // ✅ Build params for queries
  const commonParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({ ...form }).filter(([_, val]) => val?.trim() !== "")
      ),
    [form]
  );

  // ✅ Queries
  const {
    data: volumeRes,
    isLoading: volumeLoading,
    isError: volumeError,
  } = useGetRequest<{ volume: VolumeItem[] }>(
    `${vaultURL}analytics/volume`,
    ["volume", commonParams],
    {
      enabled: !!form.start_date || !!form.end_date || !!form.chain,
      retry: false,
      onError: () => message.error("Error fetching volume data"),
      select: (res) => res,
    }
  );

  const {
    data: transactionRes,
    isLoading: transactionLoading,
    isError: transactionError,
  } = useGetRequest<{ transaction: TransactionItem[] }>(
    `${vaultURL}analytics/transaction`,
    ["transaction", commonParams],
    {
      enabled: !!form.start_date || !!form.end_date || !!form.chain,
      retry: false,
      onError: () => message.error("Error fetching transaction data"),
      select: (res) => res,
    }
  );

  const {
    data: earnRes,
    isLoading: earnLoading,
    isError: earnError,
  } = useGetRequest<EarnResponse>(
    `${vaultURL}analytics/earn`,
    ["earn", form.start_date, form.end_date],
    {
      enabled: !!form.start_date || !!form.end_date,
      retry: false,
      onError: () => message.error("Error fetching earn data"),
      select: (res) => res,
    }
  );

  const {
    data: activeRes,
    isLoading: activeLoading,
    isError: activeError,
  } = useGetRequest<ActiveUserResponse>(
    `${vaultURL}analytics/monthly-active`,
    ["activeUsers", form.start_date, form.end_date],
    {
      enabled: !!form.start_date || !!form.end_date,
      retry: false,
      onError: () => message.error("Error fetching active users data"),
      select: (res) => res,
    }
  );

  const loading = volumeLoading || transactionLoading || earnLoading || activeLoading;

  const volumeData = volumeRes?.volume || [];
  const transactionData = transactionRes?.transaction || [];
  const earnData = earnRes || { deposit: [], withdraw: [] };
  const activeUserStats = activeRes || null;

  // ✅ Derived metrics (unchanged)
  const earnMetrics = useMemo(() => {
    const usdcDeposit = earnData.deposit.find((e) => e.token_in === USDC_MINT);
    const solDeposit = earnData.deposit.find((e) => e.token_in === SOL_MINT);
    const usdcWithdraw = earnData.withdraw.find((e) => e.token_out === USDC_MINT);
    const solWithdraw = earnData.withdraw.find((e) => e.token_out === SOL_MINT);

    return {
      usdcDepositAmount: usdcDeposit ? parseFloat(usdcDeposit.total_deposit!) : 0,
      solDepositAmount: solDeposit ? parseFloat(solDeposit.total_deposit!) : 0,
      usdcDepositCount: usdcDeposit ? parseInt(usdcDeposit.count) : 0,
      solDepositCount: solDeposit ? parseInt(solDeposit.count) : 0,
      usdcWithdrawAmount: usdcWithdraw ? parseFloat(usdcWithdraw.total_withdraw!) : 0,
      solWithdrawAmount: solWithdraw ? parseFloat(solWithdraw.total_withdraw!) : 0,
      usdcWithdrawCount: usdcWithdraw ? parseInt(usdcWithdraw.count) : 0,
      solWithdrawCount: solWithdraw ? parseInt(solWithdraw.count) : 0,
      totalUsdcVolume:
        (usdcDeposit ? parseFloat(usdcDeposit.total_deposit!) : 0) +
        (usdcWithdraw ? parseFloat(usdcWithdraw.total_withdraw!) : 0),
      totalSolVolume:
        (solDeposit ? parseFloat(solDeposit.total_deposit!) : 0) +
        (solWithdraw ? parseFloat(solWithdraw.total_withdraw!) : 0),
    };
  }, [earnData]);

  const items: TabsProps["items"] = [
    { key: "active", label: "Holding Analytics", children: <AnalyticsHolding /> },
    {
      key: "volume",
      label: "Volume Analytics",
      children: <VolumeAnalytics volumeData={volumeData} earnMetrics={earnMetrics} loading={loading} />,
    },
    {
      key: "transaction",
      label: "Transactions Analytics",
      children: (
        <TransactionAnalytics transactionData={transactionData} earnMetrics={earnMetrics} loading={loading} />
      ),
    },
  ];

  const renderActiveUserCard = () => (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 bg-[#161616] p-4 rounded-[24px] border-dashboard-top">
      <Card style={{ background: "transparent", border: "none" }}>
        {loading || !activeUserStats ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <div className="flex flex-wrap gap-4 text-white">
            {/* your card map logic stays unchanged */}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col gap-6 mt-10">

      <div className="px-[10px] sm:px-[20px] md:px-[120px]">
        {renderActiveUserCard()}
      </div>

      <div className="px-3 sm:px-4 md:px-6 mt-2 lg:px-[120px]">
        <Tabs
          defaultActiveKey="active"
          items={items}
          className="custom-tabss"
          size="large"
          onChange={(key) => setActiveTab(key)}
        />
      </div>
    </div>
  );
};

export default MonthlyActive;
