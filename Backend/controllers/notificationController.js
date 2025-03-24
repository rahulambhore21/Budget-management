const Notification = require('../models/Notification');

// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    // Parse query parameters
    const { limit = 20, unreadOnly = false } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });
    
    res.status(200).json({
      status: 'success',
      results: notifications.length,
      unreadCount,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }
    
    // Ensure user can only mark their own notifications
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this notification'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('Mark all notifications as read error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }
    
    // Ensure user can only delete their own notifications
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this notification'
      });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
