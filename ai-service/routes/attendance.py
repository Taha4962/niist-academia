from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class AttendanceRecord(BaseModel):
  student_id: int
  name: str
  enrollment_no: str
  present: int
  absent: int
  late: int

@router.post('/check')
def check_attendance(records: List[AttendanceRecord]):
  alerts = []
  for r in records:
    total = r.present + r.absent + r.late
    if total == 0:
      continue
    percentage = round((r.present / total) * 100, 2)
    if percentage < 75:
      needed = max(0, int((0.75 * total - r.present) / (1 - 0.75)) + 1)
      alerts.append({
        'student_id': r.student_id,
        'name': r.name,
        'enrollment_no': r.enrollment_no,
        'percentage': percentage,
        'present': r.present,
        'absent': r.absent,
        'late': r.late,
        'classes_needed': needed
      })
  return {
    'total_checked': len(records),
    'alerts_count': len(alerts),
    'below_75_percent': alerts
  }
