import { Redirect } from "wouter";

export default function WithdrawalHistoryPage() {
  return <Redirect to="/deposit-orders?tab=withdrawal" />;
}
