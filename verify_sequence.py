import re

# Read debug_report.txt and extract all matched numbers in order
numbers = []
with open("debug_report.txt", "r", encoding="utf-8") as f:
    for line in f:
        match = re.search(r"Num:\s*(\d+)", line)
        if match:
            numbers.append(int(match.group(1)))

# Filter out duplicate numbers that are bible refs (e.g. 1, 2)
# We expect a sequence from 1 to 375.
# Let's find the main sequence.
seq = []
expected = 1
for num in numbers:
    if num == expected:
        seq.append(num)
        expected += 1

print(f"Matched main sequence length: {len(seq)}")
if len(seq) == 375:
    print("Sequence is complete from 1 to 375!")
else:
    print(f"Sequence is incomplete. Last matched expected number was {expected - 1}")
    # Let's print which numbers were found around the gap
    # Let's see what numbers were extracted near the expected number
    gap_idx = expected
    print(f"Let's look for numbers around {gap_idx} in the raw matches:")
    raw_nums = []
    with open("debug_report.txt", "r", encoding="utf-8") as f:
        for line in f:
            if f"Num: {gap_idx}" in line or f"Num: {gap_idx - 1}" in line or f"Num: {gap_idx + 1}" in line:
                print(line.strip())
