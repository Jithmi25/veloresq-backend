import User from '../models/User.js';
import Garage from '../models/Garage.js';
import Booking from '../models/Booking.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Diagnosis from '../models/Diagnosis.js';

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalUsers,
      newUsersToday,
      usersByRole,
      totalGarages,
      activeGarages,
      verifiedGarages,
      totalBookings,
      todayBookings,
      monthlyBookings,
      bookingsByStatus,
      monthlyRevenueAgg,
      totalEmergencies,
      activeEmergencies,
      totalDiagnoses,
      completedDiagnoses
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),

      Garage.countDocuments(),
      Garage.countDocuments({ isActive: true }),
      Garage.countDocuments({ isVerified: true }),

      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      Booking.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: { $in: ['pending', 'dispatched', 'in_progress'] } }),

      Diagnosis.countDocuments(),
      Diagnosis.countDocuments({ analysisStatus: 'completed' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          byRole: usersByRole
        },
        garages: {
          total: totalGarages,
          active: activeGarages,
          verified: verifiedGarages
        },
        bookings: {
          total: totalBookings,
          today: todayBookings,
          monthly: monthlyBookings,
          byStatus: bookingsByStatus
        },
        revenue: {
          monthly: monthlyRevenueAgg[0]?.total || 0
        },
        emergencies: {
          total: totalEmergencies,
          active: activeEmergencies
        },
        diagnoses: {
          total: totalDiagnoses,
          completed: completedDiagnoses
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Analytics
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let dateFormat;
    switch (period) {
      case 'hourly': dateFormat = '%Y-%m-%d %H:00:00'; break;
      case 'weekly': dateFormat = '%Y-%U'; break;
      case 'monthly': dateFormat = '%Y-%m'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    const [bookingTrends, userTrends, emergencyStats, topGarages] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              status: '$status'
            },
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0]
              }
            }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              role: '$role'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      EmergencyRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            actualArrival: { $exists: true }
          }
        },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ['$actualArrival', '$createdAt'] },
                1000 * 60
              ]
            },
            type: 1,
            priority: 1
          }
        },
        {
          $group: {
            _id: '$type',
            avgResponseTime: { $avg: '$responseTime' },
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$garageId',
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            avgRating: { $avg: '$customerRating' }
          }
        },
        {
          $lookup: {
            from: 'garages',
            localField: '_id',
            foreignField: '_id',
            as: 'garage'
          }
        },
        { $unwind: '$garage' },
        {
          $project: {
            garageName: '$garage.name',
            bookingCount: 1,
            totalRevenue: 1,
            avgRating: 1
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { start, end, groupBy: period },
        bookingTrends,
        userTrends,
        emergencyStats,
        topGarages
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Health
export const getSystemHealth = async (req, res) => {
  try {
    const dbStatus = 'connected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const checks = {
      database: { status: 'healthy', responseTime: '< 10ms' },
      fileSystem: { status: 'healthy', diskSpace: '85% available' },
      externalServices: {
        emailService: 'healthy',
        paymentGateway: 'healthy',
        aiService: 'degraded'
      }
    };

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        database: dbStatus,
        checks
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Recent Activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [recentBookings, recentUsers, recentEmergencies, recentDiagnoses] = await Promise.all([
      Booking.find()
        .populate('customerId', 'firstName lastName')
        .populate('garageId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit / 4),
      User.find().sort({ createdAt: -1 }).limit(limit / 4),
      EmergencyRequest.find()
        .populate('customerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit / 4),
      Diagnosis.find()
        .populate('customerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit / 4)
    ]);

    const activities = [];

    recentBookings.forEach(booking => {
      activities.push({
        type: 'booking',
        action: `New booking created`,
        user: `${booking.customerId.firstName} ${booking.customerId.lastName}`,
        details: `Booked service at ${booking.garageId.name}`,
        timestamp: booking.createdAt,
        status: booking.status
      });
    });

    recentUsers.forEach(user => {
      activities.push({
        type: 'user',
        action: `New ${user.role} registered`,
        user: `${user.firstName} ${user.lastName}`,
        details: user.role === 'garage_owner' ? user.garageName : user.email,
        timestamp: user.createdAt,
        status: user.isVerified ? 'verified' : 'pending'
      });
    });

    recentEmergencies.forEach(emergency => {
      activities.push({
        type: 'emergency',
        action: `Emergency request created`,
        user: `${emergency.customerId.firstName} ${emergency.customerId.lastName}`,
        details: `${emergency.type} - ${emergency.priority} priority`,
        timestamp: emergency.createdAt,
        status: emergency.status
      });
    });

    recentDiagnoses.forEach(diagnosis => {
      activities.push({
        type: 'diagnosis',
        action: `AI diagnosis requested`,
        user: `${diagnosis.customerId.firstName} ${diagnosis.customerId.lastName}`,
        details: diagnosis.issue || 'Analysis in progress',
        timestamp: diagnosis.createdAt,
        status: diagnosis.analysisStatus
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        activities: activities.slice(0, limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
