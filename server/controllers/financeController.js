const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get all transactions for the authenticated user
// @route   GET /api/finance/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {
      user: req.user._id,
    };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const transactions = await Transaction.find(query).sort({
      date: -1,
      createdAt: -1,
    });

    res.status(200).json({
      transactions,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Create a new transaction
// @route   POST /api/finance/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      date,
      description,
    } = req.body;

    if (!title || amount === undefined || !type) {
      return res.status(400).json({
        message: 'Title, amount and type are required',
      });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0',
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: numericAmount,
      type,
      category: category || 'Other',
      date: date || Date.now(),
      description: description || '',
    });

    res.status(201).json({
      transaction,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update a transaction
// @route   PUT /api/finance/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
      });
    }

    const {
      title,
      amount,
      type,
      category,
      date,
      description,
    } = req.body;

    if (title !== undefined) {
      transaction.title = title;
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (
        Number.isNaN(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message: 'Amount must be greater than 0',
        });
      }

      transaction.amount = numericAmount;
    }

    if (type !== undefined) {
      transaction.type = type;
    }

    if (category !== undefined) {
      transaction.category = category;
    }

    if (date !== undefined) {
      transaction.date = date;
    }

    if (description !== undefined) {
      transaction.description = description;
    }

    await transaction.save();

    res.status(200).json({
      transaction,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Delete a transaction
// @route   DELETE /api/finance/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction =
      await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update monthly budget
// @route   PUT /api/finance/budget
// @access  Private
const updateMonthlyBudget = async (req, res, next) => {
  try {
    const { monthlyBudget } = req.body;

    const budget = Number(monthlyBudget);

    if (
      monthlyBudget === undefined ||
      monthlyBudget === null ||
      Number.isNaN(budget) ||
      budget <= 0
    ) {
      return res.status(400).json({
        message:
          'Please provide a valid monthly budget greater than 0',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          monthlyBudget: budget,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      message: 'Monthly budget updated successfully',
      monthlyBudget: user.monthlyBudget,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get full finance summary
// @route   GET /api/finance/summary
// @access  Private
const getFinanceSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const allTransactions = await Transaction.find({
      user: userId,
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let monthIncome = 0;
    let monthExpenses = 0;

    const categoryTotals = {};

    for (const t of allTransactions) {
      const isThisMonth =
        t.date >= startOfMonth &&
        t.date <= endOfMonth;

      if (t.type === 'income') {
        totalIncome += t.amount;

        if (isThisMonth) {
          monthIncome += t.amount;
        }
      } else {
        totalExpenses += t.amount;

        if (isThisMonth) {
          monthExpenses += t.amount;

          categoryTotals[t.category] =
            (categoryTotals[t.category] || 0) +
            t.amount;
        }
      }
    }

    const spendingByCategory = Object.entries(
      categoryTotals
    ).map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
    }));

    // Last 7 days spending
    const dailyTrend = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();

      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);

      const nextDay = new Date(day);

      nextDay.setDate(nextDay.getDate() + 1);

      const daySpent = allTransactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.date >= day &&
            t.date < nextDay
        )
        .reduce(
          (sum, t) => sum + t.amount,
          0
        );

      dailyTrend.push({
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        amount:
          Math.round(daySpent * 100) / 100,
      });
    }

    const monthlyBudget =
      user?.monthlyBudget || 0;

    const budgetUsagePercent =
      monthlyBudget > 0
        ? Math.round(
            (monthExpenses / monthlyBudget) * 100
          )
        : 0;

    const remainingBudget =
      monthlyBudget - monthExpenses;

    res.status(200).json({
      totalIncome:
        Math.round(totalIncome * 100) / 100,

      totalExpenses:
        Math.round(totalExpenses * 100) / 100,

      balance:
        Math.round(
          (totalIncome - totalExpenses) * 100
        ) / 100,

      monthIncome:
        Math.round(monthIncome * 100) / 100,

      monthExpenses:
        Math.round(monthExpenses * 100) / 100,

      monthlyBudget,

      remainingBudget:
        Math.round(remainingBudget * 100) / 100,

      budgetUsagePercent,

      spendingByCategory,

      dailyTrend,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateMonthlyBudget,
  getFinanceSummary,
};
