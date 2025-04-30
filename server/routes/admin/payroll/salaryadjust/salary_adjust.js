const express = require('express');
const router = express.Router();
const moment = require('moment');

function getMonthDetails(year, month) {
  const totalDays = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
  let saturdays = 0, sundays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    if (date.day() === 6) saturdays++;
    if (date.day() === 0) sundays++;
  }

  return { totalDays, saturdays, sundays };
}

router.get('/', (req, res) => {
  res.render('admin/payroll/salaryadjust/salary_adjust', { title: 'Salary Adjustment' });
});

router.post('/calculate', (req, res) => {
  try {
    const { month, deduction, salary } = req.body;
    const [year, mon] = month.split('-');

    const { totalDays, saturdays, sundays } = getMonthDetails(year, mon);
    const workDays = totalDays - saturdays - sundays;
    const adjustedWorkDays = workDays - (parseInt(deduction) || 0);
    const adjSalary = (salary * adjustedWorkDays / workDays);
    const fixSalary = Math.round(adjSalary);

    res.json({
      year,
      mon,
      totalDays,
      saturdays,
      sundays,
      workDays,
      adjustedWorkDays,
      originalSalary: parseFloat(salary).toFixed(2),
      adjSalary: adjSalary.toFixed(2),
      fixSalary: fixSalary.toFixed(2)
    });
  } catch (err) {
    console.error('Salary adjustment error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
