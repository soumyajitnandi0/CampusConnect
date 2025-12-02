const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');

exports.getOrganizerStats = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id });
        const eventIds = events.map(e => e._id);

        const totalEvents = events.length;

        const rsvps = await RSVP.find({ event: { $in: eventIds } });
        const totalRSVPs = rsvps.length;
        const totalAttended = rsvps.filter(r => r.attended).length;

        // Calculate average rating across all events
        const feedbacks = await Feedback.find({ event: { $in: eventIds } });
        const totalFeedback = feedbacks.length;
        const avgRating = totalFeedback > 0
            ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(1)
            : 0;

        res.json({
            totalEvents,
            totalRSVPs,
            totalAttended,
            avgRating,
            attendanceRate: totalRSVPs > 0 ? ((totalAttended / totalRSVPs) * 100).toFixed(1) : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getEventStats = async (req, res) => {
    try {
        const eventId = req.params.eventId || req.params.id;
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Get all RSVPs with user details
        const rsvps = await RSVP.find({ event: eventId, status: 'going' })
            .populate('user', 'name email rollNo yearSection')
            .sort({ createdAt: -1 });

        const totalRSVPs = rsvps.length;

        // Get all check-ins for this event with user details
        const checkIns = await CheckIn.find({ event: eventId })
            .populate('user', 'name email rollNo yearSection')
            .sort({ checkInTime: -1 });

        const attended = checkIns.length;

        // Get feedbacks with user details
        const feedbacks = await Feedback.find({ event: eventId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        const avgRating = feedbacks.length > 0
            ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
            : 0;

        // Get attendees list (those who checked in) with check-in time
        const attendees = checkIns.map(checkIn => ({
            id: checkIn.user._id,
            name: checkIn.user.name,
            email: checkIn.user.email,
            rollNo: checkIn.user.rollNo,
            yearSection: checkIn.user.yearSection,
            checkInTime: checkIn.checkInTime,
            checkInId: checkIn._id,
        }));

        // Get all RSVPs (coming) with check-in status
        const coming = rsvps.map(r => {
            // Find if this user has checked in
            const checkIn = checkIns.find(ci => ci.user._id.toString() === r.user._id.toString());
            
            return {
                id: r.user._id,
                name: r.user.name,
                email: r.user.email,
                rollNo: r.user.rollNo,
                yearSection: r.user.yearSection,
                attended: !!checkIn,
                checkInTime: checkIn ? checkIn.checkInTime : null,
                rsvpDate: r.createdAt,
            };
        });

        res.json({
            event,
            stats: {
                totalRSVPs,
                attended,
                avgRating,
                attendanceRate: totalRSVPs > 0 ? Math.round((attended / totalRSVPs) * 100) : 0,
            },
            attendees, // List of checked-in attendees
            coming, // List of all RSVPs (coming)
            feedbacks: feedbacks.map(fb => ({
                id: fb._id,
                user: {
                    id: fb.user._id,
                    name: fb.user.name,
                    email: fb.user.email,
                },
                rating: fb.rating,
                comment: fb.comment,
                createdAt: fb.createdAt,
            })),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
