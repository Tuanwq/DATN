
from pathlib import Path
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)

categories = {
    "Food": (40000, 160000),
    "Transport": (15000, 90000),
    "Shopping": (50000, 400000),
    "Entertainment": (30000, 250000),
}

records = []

dates = pd.date_range(
    start="2023-01-01",
    end="2025-12-31",
    freq="D"
)

for date in dates:
    # Trung bình 3 giao dịch chi tiêu mỗi ngày
    num_transactions = rng.poisson(3)

    for _ in range(num_transactions):
        category = rng.choice(list(categories.keys()))
        min_amount, max_amount = categories[category]

        amount = rng.integers(min_amount, max_amount)

        records.append({
            "date": date,
            "category": category,
            "amount": int(amount),
            "type": "expense"
        })

df = pd.DataFrame(records)

output = Path(__file__).resolve().parent.parent / "data" / "transactions.csv"
output.parent.mkdir(parents=True, exist_ok=True)

df.to_csv(output, index=False)

print("Generated transactions:", len(df))
print(df.head())
print("Saved to:", output)
