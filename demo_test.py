"""
End-to-end demo script — exercises every API endpoint.
Run while the backend is running on port 8000.
"""
import requests
import json

BASE = "http://localhost:8000"

# ── 1. Create a student ─────────────────────────────────────────────────
print("=== 1. Creating Student ===")
r = requests.post(
    f"{BASE}/students",
    json={"name": "Ravi Kumar", "email": "ravi@test.com", "phone": "9876543210", "stream": "MPC"},
)
student = r.json()
sid = student["id"]
print(f"  Student created: ID={sid}, Name={student['name']}, Stream={student['stream']}")

# ── 2. Generate adaptive daily test ─────────────────────────────────────
print("\n=== 2. Generating Adaptive Daily Test ===")
r = requests.get(f"{BASE}/daily-test?student_id={sid}&num_questions=12")
test = r.json()
print(f"  Test ID: {test['test_id']}, Total Questions: {test['total_questions']}")
for q in test["questions"][:3]:
    text = q["question_text"][:60]
    print(f"    Q{q['id']}: [{q['topic']}] [{q['difficulty']}] {text}...")
print(f"    ... and {len(test['questions']) - 3} more questions")

# ── 3. Submit answers (pick first option for all — simulated) ───────────
print("\n=== 3. Submitting Test Answers ===")
answers = {}
time_per = {}
for q in test["questions"]:
    answers[str(q["id"])] = q["options"][0]  # pick first option
    time_per[str(q["id"])] = 15.0

r = requests.post(
    f"{BASE}/submit-test",
    json={
        "student_id": sid,
        "test_id": test["test_id"],
        "answers": answers,
        "time_per_question": time_per,
    },
)
result = r.json()
pct = result["score"] * 100
print(f"  Score: {pct:.0f}% ({result['correct_count']}/{result['total_questions']})")
print(f"  Weak Topics: {result['updated_weak_topics']}")
coaching = result["coaching_feedback"][:150]
print(f"  Coaching: {coaching}...")

# Show per-question results
correct_qs = [r2 for r2 in result["results"] if r2["is_correct"]]
wrong_qs = [r2 for r2 in result["results"] if not r2["is_correct"]]
print(f"  Correct: {len(correct_qs)}, Wrong: {len(wrong_qs)}")
if wrong_qs:
    w = wrong_qs[0]
    print(f"    Example wrong: [{w['topic']}] Your answer='{w['student_answer']}', Correct='{w['correct_answer']}'")
    if w.get("explanation"):
        print(f"    Explanation: {w['explanation'][:120]}...")

# ── 4. Check performance snapshot ──────────────────────────────────────
print("\n=== 4. Performance Snapshot ===")
r = requests.get(f"{BASE}/students/{sid}/performance")
perf = r.json()
print(f"  Overall accuracy: {perf['overall_accuracy']*100:.0f}%")
print(f"  Questions attempted: {perf['total_questions_attempted']}")
print(f"  Weak topics: {perf['weak_topics']}")
for topic, acc in perf["topic_accuracies"].items():
    print(f"    {topic}: {acc*100:.0f}%")

# ── 5. Generate 7-Day Study Plan ──────────────────────────────────────
print("\n=== 5. Generating 7-Day Study Plan ===")
r = requests.post(f"{BASE}/generate-plan", json={"student_id": sid})
plan = r.json()
msg = plan["message"][:150]
print(f"  Message: {msg}...")
print(f"  Weak topics addressed: {plan['weak_topics_addressed']}")
for day in plan["plan"]:
    resources = len(day.get("study_resources", []))
    total_qs = sum(len(t.get("content_questions", [])) for t in day["practice_tasks"])
    topics = ", ".join(day["focus_topics"])
    tasks = len(day["practice_tasks"])
    print(f"    Day {day['day']}: Focus=[{topics}] | {tasks} tasks | {resources} resources | {total_qs} practice Qs")

# ── 6. Verify question bank ────────────────────────────────────────────
print("\n=== 6. Question Bank ===")
r = requests.get(f"{BASE}/questions/count")
print(f"  Total questions: {r.json()['total_questions']}")
r = requests.get(f"{BASE}/questions?topic=Algebra&limit=3")
qs = r.json()
for q in qs[:2]:
    print(f"    [{q['difficulty']}] {q['question_text'][:50]}... Answer: {q['answer']}")

print("\n" + "=" * 60)
print("  ALL SYSTEMS WORKING — DEMO COMPLETE!")
print("=" * 60)
