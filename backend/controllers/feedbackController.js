const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');

exports.submitFeedback = async (req, res) => {
    const { eventId, rating, comment } = req.body;

    try {
        // Check if user attended the event (optional, but good practice)
        const rsvp = await RSVP.findOne({ event: eventId, user: req.user.id, status: 'attended' });

        // For now, let's allow feedback if they just RSVP'd or if we want to be strict about attendance
        // if (!rsvp) {
        //   return res.status(400).json({ msg: 'You must attend the event to give feedback' });
        // }

        let feedback = await Feedback.findOne({ event: eventId, user: req.user.id });
        if (feedback) {
            return res.status(400).json({ msg: 'Feedback already submitted' });
        }

        feedback = new Feedback({
            event: eventId,
            user: req.user.id,
            rating,
            comment
        });

        await feedback.save();
        res.json(feedback);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getEventFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ event: req.params.eventId }).populate('user', 'name');
        res.json(feedback);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
