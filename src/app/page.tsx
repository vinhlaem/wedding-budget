import { useSearchParams } from "next/navigation";
import BudgetDashboard from "../components/BudgetDashboard";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shareToken = searchParams.get("shareToken");
    const acceptShare = async () => {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000"}/budgets/share/accept`,
          { token: shareToken },
        );
        localStorage.removeItem("wb:pendingShareToken");
      } catch (err) {
        console.error("Failed to accept share token after login", err);
      }
    };
    if (shareToken) {
      acceptShare();
    }
  }, [searchParams]);

  return <BudgetDashboard />;
}
