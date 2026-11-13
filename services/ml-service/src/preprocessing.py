
from pathlib import Path
import pandas as pd

base_dir = Path(__file__).resolve().parent.parent

df = pd.read_csv(
    base_dir / "data" / "transactions.csv",
    parse_dates=["date"]
)

expenses = df[df["type"] == "expense"].copy()

expenses["month"] = expenses["date"].dt.to_period("M")

monthly = (
    expenses.groupby("month")["amount"]
    .sum()
    .reset_index(name="total_expense")
)

monthly["month"] = monthly["month"].astype(str)

output = base_dir / "data" / "monthly_expenses.csv"

monthly.to_csv(output, index=False)

print(monthly.head())
print("Number of months:", len(monthly))
