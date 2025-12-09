const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');

// Verify QR code and check in user
exports.verifyQR = async (req, res) => {
    try {
        const { qrToken, eventId, userId: providedUserId } = req.body;
        
        console.log('Check-in request:', { eventId, hasQrToken: !!qrToken, providedUserId });
        
        // If qrToken is provided, decode it to get userId
        let userId = providedUserId || req.user?.id;
        let qrEventId = eventId;
        
        if (qrToken) {
            try {
                const qrData = JSON.parse(qrToken);
                console.log('Parsed QR data:', qrData);
                
                if (qrData.userId && qrData.eventId) {
                    userId = qrData.userId;
                    qrEventId = qrData.eventId;
                    
                    // Verify QR code matches event if eventId was provided
                    if (eventId && qrData.eventId !== eventId) {
                        return res.status(400).json({ msg: 'QR code does not match this event' });
                    }
                    
                    // Check if QR code is expired (24 hours)
                    const age = Date.now() - qrData.timestamp;
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    if (age > maxAge) {
                        return res.status(400).json({ msg: 'QR code has expired' });
                    }
                } else {
                    return res.status(400).json({ msg: 'Invalid QR code format' });
                }
            } catch (parseError) {
                console.error('QR token parse error:', parseError);
                return res.status(400).json({ msg: 'Invalid QR code format' });
            }
        }

        if (!userId) {
            return res.status(400).json({ msg: 'User ID is required' });
        }

        const finalEventId = eventId || qrEventId;
        if (!finalEventId) {
            return res.status(400).json({ msg: 'Event ID is required' });
        }

        const event = await Event.findById(finalEventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if user has already checked in
        const existingCheckIn = await CheckIn.findOne({ event: finalEventId, user: userId });
        if (existingCheckIn) {
            return res.status(400).json({ 
                msg: 'Already checked in',
                checkInTime: existingCheckIn.checkInTime
            });
        }

        // Parse QR data if available
        let qrDataObj = null;
        if (qrToken) {
            try {
                qrDataObj = JSON.parse(qrToken);
            } catch (parseError) {
                // Ignore parse error
            }
        }

        // Create check-in record with current date and time
        // Wrap in try-catch to handle race conditions
        let checkIn;
        try {
            checkIn = new CheckIn({
                user: userId,
                event: finalEventId,
                checkInTime: new Date(), // Store exact check-in date and time
                qrData: qrDataObj || null,
            });
            await checkIn.save();
        } catch (saveError) {
            // Handle duplicate key error (race condition)
            if (saveError.code === 11000 || saveError.message.includes('duplicate key')) {
                // Fetch the existing check-in
                const existingCheckIn = await CheckIn.findOne({ event: finalEventId, user: userId });
                if (existingCheckIn) {
                    checkIn = existingCheckIn;
                    // Still update RSVP status below
                } else {
                    return res.status(400).json({ 
                        msg: 'Already checked in'
                    });
                }
            } else {
                throw saveError; // Re-throw if it's a different error
            }
        }

        // Update RSVP status if exists, or create new one
        let rsvp = await RSVP.findOne({ event: finalEventId, user: userId });
        
        if (!rsvp) {
            // Auto-RSVP if they scan (optional behavior)
            rsvp = new RSVP({
                event: finalEventId,
                user: userId,
                status: 'going',
                attended: true
            });
            await rsvp.save();
            
            // Increment RSVP count
            await Event.findByIdAndUpdate(finalEventId, { $inc: { rsvpCount: 1 } });
            
            console.log('Created new RSVP and checked in user:', userId);
        } else {
            rsvp.attended = true;
            await rsvp.save();
            
            console.log('Updated existing RSVP and checked in user:', userId);
        }

        console.log('Check-in recorded:', {
            userId,
            eventId: finalEventId,
            checkInTime: checkIn.checkInTime
        });

        res.json({ 
            msg: 'Attendance recorded successfully', 
            checkIn: {
                id: checkIn._id,
                userId: checkIn.user,
                eventId: checkIn.event,
                checkInTime: checkIn.checkInTime,
            },
            rsvp: {
                id: rsvp._id,
                userId: rsvp.user,
                eventId: rsvp.event,
                attended: rsvp.attended,
            }
        });
    } catch (err) {
        console.error('Check-in error:', err);
        
        // Handle duplicate key error specifically
        if (err.code === 11000 || err.message.includes('duplicate key')) {
            // Try to get the existing check-in
            try {
                const existingCheckIn = await CheckIn.findOne({ 
                    user: req.body.userId || req.user?.id, 
                    event: req.body.eventId 
                });
                if (existingCheckIn) {
                    return res.status(400).json({ 
                        msg: 'Already checked in',
                        checkInTime: existingCheckIn.checkInTime
                    });
                }
            } catch (findError) {
                // If we can't find it, just return the duplicate error
            }
            return res.status(400).json({ msg: 'Already checked in' });
        }
        
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Get check-in status
exports.getCheckInStatus = async (req, res) => {
    try {
        const { eventId, userId } = req.params;
        const checkIn = await CheckIn.findOne({ event: eventId, user: userId });
        const rsvp = await RSVP.findOne({ event: eventId, user: userId });
        
        res.json({
            attended: !!checkIn,
            checkInTime: checkIn?.checkInTime || null,
            rsvpd: !!rsvp,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get event attendance statistics
exports.getAttendanceStats = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const totalRSVPs = await RSVP.countDocuments({ event: eventId, status: 'going' });
        const checkedIn = await CheckIn.countDocuments({ event: eventId });
        const attendanceRate = totalRSVPs > 0 ? Math.round((checkedIn / totalRSVPs) * 100) : 0;

        res.json({
            totalRSVPs,
            checkedIn,
            attendanceRate,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get user attendance records (all checked-in events)
exports.getUserAttendance = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        console.log('Fetching attendance for user:', userId, typeof userId);

        // Convert userId to ObjectId to ensure proper matching
        const mongoose = require('mongoose');
        let queryUserId = userId;
        
        // Try to convert to ObjectId if it's a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(userId)) {
            queryUserId = new mongoose.Types.ObjectId(userId);
        }

        // Get ALL check-ins for the user (all events where user has already checked in)
        const checkIns = await CheckIn.find({ user: queryUserId })
            .populate({
                path: 'event',
                populate: [
                    {
                        path: 'organizer',
                        select: 'name email'
                    },
                    {
                        path: 'club',
                        select: 'name'
                    }
                ]
            })
            .sort({ checkInTime: -1 }) // Most recent first
            .limit(limit)
            .skip(skip);

        console.log(`Found ${checkIns.length} check-ins for user ${userId}`);

        // Transform the data to include event information - only show events that are already checked in
        const attendanceRecords = checkIns
            .filter(checkIn => {
                // Only include check-ins where event exists (not deleted)
                if (!checkIn.event) {
                    console.warn(`Check-in ${checkIn._id} has no event associated`);
                    return false;
                }
                return true;
            })
            .map(checkIn => ({
                id: checkIn._id.toString(),
                checkInTime: checkIn.checkInTime,
                event: {
                    id: checkIn.event._id.toString(),
                    title: checkIn.event.title,
                    description: checkIn.event.description,
                    date: checkIn.event.date,
                    location: checkIn.event.location,
                    organizer: checkIn.event.organizer?.name || 'Unknown',
                    clubName: checkIn.event.club?.name,
                    category: checkIn.event.category,
                    imageUrl: checkIn.event.imageUrl,
                }
            }));

        // Get total count of all checked-in events for this user
        const totalCount = await CheckIn.countDocuments({ user: queryUserId });
        
        console.log(`Total checked-in events: ${totalCount}, returning ${attendanceRecords.length} records`);

        res.json({
            records: attendanceRecords,
            total: totalCount,
            limit,
            skip,
        });
    } catch (err) {
        console.error('Get User Attendance Error:', err);
        console.error('Error stack:', err.stack);
        console.error('User ID:', req.user?.id);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};
