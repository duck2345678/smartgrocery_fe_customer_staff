export const HOURLY_RATE = 30000;

export type DayRecord = {
  date: string;
  day: string;
  shiftType: string;
  hours: number;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'OFF';
};

export type MonthPayslip = {
  month: string;
  monthKey: string;
  records: DayRecord[];
};

export const PAYSLIP_DATA: MonthPayslip[] = [
  {
    month: 'Tháng 5, 2026',
    monthKey: '2026-05',
    records: [
      { date: '06/05', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '05/05', day: 'Thứ Hai', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '03/05', day: 'Thứ Bảy', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '02/05', day: 'Thứ Sáu', shiftType: 'C', hours: 8, status: 'ON_TIME' },
    ],
  },
  {
    month: 'Tháng 4, 2026',
    monthKey: '2026-04',
    records: [
      { date: '29/04', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '28/04', day: 'Thứ Hai', shiftType: 'S', hours: 0, status: 'ABSENT' },
      { date: '26/04', day: 'Thứ Bảy', shiftType: 'C', hours: 8, status: 'ON_TIME' },
      { date: '25/04', day: 'Thứ Sáu', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '24/04', day: 'Thứ Năm', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '23/04', day: 'Thứ Tư', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '22/04', day: 'Thứ Ba', shiftType: 'C', hours: 8, status: 'ON_TIME' },
      { date: '21/04', day: 'Thứ Hai', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '19/04', day: 'Thứ Bảy', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '18/04', day: 'Thứ Sáu', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '17/04', day: 'Thứ Năm', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '16/04', day: 'Thứ Tư', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '15/04', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
    ],
  },
];

export function calculatePayslip(records: DayRecord[]) {
  let totalHours = 0;
  let grossPay = 0;
  let deduction = 0;
  let onTimeDays = 0;
  let lateDays = 0;
  let absentDays = 0;

  records.forEach((record) => {
    if (record.status === 'OFF') return;

    const dailyPay = record.hours * HOURLY_RATE;

    if (record.status === 'ON_TIME') {
      totalHours += record.hours;
      grossPay += dailyPay;
      onTimeDays += 1;
    } else if (record.status === 'LATE') {
      totalHours += record.hours;
      grossPay += dailyPay;
      deduction += dailyPay * 0.5;
      lateDays += 1;
    } else if (record.status === 'ABSENT') {
      absentDays += 1;
    }
  });

  return {
    totalHours,
    grossPay,
    deduction,
    netPay: grossPay - deduction,
    onTimeDays,
    lateDays,
    absentDays,
  };
}

export const formatVND = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;

export function getPayslipByMonthKey(monthKey: string): MonthPayslip | null {
  return PAYSLIP_DATA.find((p) => p.monthKey === monthKey) ?? null;
}

export function getCurrentMonthPayslip(referenceDate = new Date()) {
  const monthKey = referenceDate.toISOString().slice(0, 7);
  const payslip = getPayslipByMonthKey(monthKey) ?? PAYSLIP_DATA[0];
  const calc = calculatePayslip(payslip.records);
  return { ...payslip, calc };
}
