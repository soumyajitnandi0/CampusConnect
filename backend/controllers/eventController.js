const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const User = require('../models/User');

// Get all events
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .populate('club', 'name imageUrl')
            .sort({ date: 1 });
        
        // Transform to include RSVP arrays
        const eventsWithRSVPs = await Promise.all(
            events.map(async (event) => {
                const rsvps = await RSVP.find({ event: event._id, status: 'going' });
                const checkedIn = await RSVP.find({ event: event._id, attended: true });
                
                return {
                    ...event.toObject(),
                    rsvps: rsvps.map(r => r.user.toString()),
                    checkedIn: checkedIn.map(r => r.user.toString()),
                };
            })
        );
        
        res.json(eventsWithRSVPs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('club', 'name imageUrl');
        
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const rsvps = await RSVP.find({ event: event._id, status: 'going' });
        const checkedIn = await RSVP.find({ event: event._id, attended: true });

        res.json({
            ...event.toObject(),
            rsvps: rsvps.map(r => r.user.toString()),
            checkedIn: checkedIn.map(r => r.user.toString()),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get events by organizer (public route - by organizerId)
exports.getEventsByOrganizer = async (req, res) => {
    try {
        const organizerId = req.params.organizerId;
        const events = await Event.find({ organizer: organizerId })
            .populate('organizer', 'name email')
            .populate('club', 'name imageUrl')
            .sort({ date: 1 });
        
        const eventsWithRSVPs = await Promise.all(
            events.map(async (event) => {
                const rsvps = await RSVP.find({ event: event._id, status: 'going' });
                const checkedIn = await RSVP.find({ event: event._id, attended: true });
                
                return {
                    ...event.toObject(),
                    rsvps: rsvps.map(r => r.user.toString()),
                    checkedIn: checkedIn.map(r => r.user.toString()),
                };
            })
        );
        
        res.json(eventsWithRSVPs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get events for authenticated organizer (their own events)
exports.getMyEvents = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        // Verify user is organizer
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        if (user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Only organizers can access this endpoint' });
        }

        // Use the same pattern as getEventsByOrganizer
        const organizerId = req.user.id;
        const events = await Event.find({ organizer: organizerId })
            .populate('organizer', 'name email')
            .populate('club', 'name imageUrl')
            .sort({ date: 1 });
        
        const eventsWithRSVPs = await Promise.all(
            events.map(async (event) => {
                const rsvps = await RSVP.find({ event: event._id, status: 'going' });
                const checkedIn = await RSVP.find({ event: event._id, attended: true });
                
                return {
                    ...event.toObject(),
                    rsvps: rsvps.map(r => r.user.toString()),
                    checkedIn: checkedIn.map(r => r.user.toString()),
                };
            })
        );
        
        res.json(eventsWithRSVPs);
    } catch (err) {
        console.error('getMyEvents Error:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            userId: req.user?.id,
            userObject: req.user
        });
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Create event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, imageUrl, duration, club } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        // Verify user is organizer
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Only organizers can create events' });
        }

        // Validate required fields
        if (!title || !description || !date || !location) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Validate date is not in the past (compare full date with time)
        const eventDate = new Date(date);
        const now = new Date();
        
        if (eventDate < now) {
            return res.status(400).json({ msg: 'Cannot create events in the past. Please select a future date and time.' });
        }

        // Clean and validate imageUrl
        let cleanImageUrl = imageUrl;
        if (imageUrl && typeof imageUrl === 'string') {
            cleanImageUrl = imageUrl.trim();
            if (cleanImageUrl === '') {
                cleanImageUrl = undefined;
            }
        } else {
            cleanImageUrl = undefined;
        }

        // Prepare duration object with defaults
        const eventDuration = {
            days: duration?.days || 0,
            hours: duration?.hours || 0,
            minutes: duration?.minutes || 0
        };

        // Validate club if provided
        if (club) {
            const Club = require('../models/Club');
            const clubExists = await Club.findById(club);
            if (!clubExists) {
                return res.status(400).json({ msg: 'Club not found' });
            }
            // Verify organizer owns the club
            if (clubExists.organizer.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'You can only create events for clubs you own' });
            }
        }

        const newEvent = new Event({
            title,
            description,
            date,
            location,
            category,
            imageUrl: cleanImageUrl,
            duration: eventDuration,
            organizer: req.user.id,
            club: club || undefined,
        });

        const event = await newEvent.save();
        console.log('Event created successfully:', event._id);
        res.json(event);
    } catch (err) {
        console.error('Error creating event:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            body: req.body,
            user: req.user
        });
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this event' });
        }

        const { title, description, date, location, category, imageUrl, duration } = req.body;

        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (location) event.location = location;
        if (category) event.category = category;
        if (imageUrl !== undefined) event.imageUrl = imageUrl;
        if (duration) {
            event.duration = {
                days: duration.days || 0,
                hours: duration.hours || 0,
                minutes: duration.minutes || 0
            };
        }

        await event.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this event' });
        }

        // Delete all RSVPs for this event
        await RSVP.deleteMany({ event: eventId });
        
        await Event.findByIdAndDelete(eventId);
        res.json({ msg: 'Event deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// RSVP to event
exports.rsvpEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const { status } = req.body;

        // Get event to check if it's in the past
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if event is canceled
        if (event.status === 'canceled') {
            return res.status(400).json({ msg: 'Cannot RSVP to canceled events' });
        }

        // Check if event date has passed
        const eventDate = new Date(event.date);
        const now = new Date();
        
        if (eventDate < now) {
            return res.status(400).json({ msg: 'Cannot RSVP to past events' });
        }

        let rsvp = await RSVP.findOne({ event: eventId, user: userId });

        if (rsvp) {
            rsvp.status = status || 'going';
            await rsvp.save();
        } else {
            rsvp = new RSVP({
                event: eventId,
                user: userId,
                status: status || 'going',
            });
            await rsvp.save();

            // Increment RSVP count
            await Event.findByIdAndUpdate(eventId, { $inc: { rsvpCount: 1 } });
        }

        res.json(rsvp);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Cancel RSVP
exports.cancelRSVP = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const rsvp = await RSVP.findOne({ event: eventId, user: userId });
        
        if (!rsvp) {
            return res.status(404).json({ msg: 'RSVP not found' });
        }

        await RSVP.findByIdAndDelete(rsvp._id);
        
        // Decrement RSVP count
        await Event.findByIdAndUpdate(eventId, { $inc: { rsvpCount: -1 } });

        res.json({ msg: 'RSVP cancelled successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Cancel event
exports.cancelEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { reason } = req.body;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to cancel this event' });
        }

        // Check if event is already canceled
        if (event.status === 'canceled') {
            return res.status(400).json({ msg: 'Event is already canceled' });
        }

        event.status = 'canceled';
        if (reason) {
            event.cancelReason = reason;
        }

        await event.save();
        res.json({ msg: 'Event canceled successfully', event });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Reschedule event
exports.rescheduleEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { date, location } = req.body;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to reschedule this event' });
        }

        // Validate new date is not in the past
        if (date) {
            const newDate = new Date(date);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            if (newDate < now) {
                return res.status(400).json({ msg: 'Cannot reschedule to a past date' });
            }
        }

        // Update event
        if (date) {
            event.date = new Date(date);
            event.rescheduledDate = new Date(date);
        }
        if (location) {
            event.location = location;
        }
        event.status = 'rescheduled';

        await event.save();
        res.json({ msg: 'Event rescheduled successfully', event });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
