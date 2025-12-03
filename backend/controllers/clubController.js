const Club = require('../models/Club');
const Event = require('../models/Event');
const User = require('../models/User');

// Create club
exports.createClub = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        // Verify user is organizer
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Only organizers can create clubs' });
        }

        const { name, description, imageUrl, category } = req.body;

        if (!name || !description) {
            return res.status(400).json({ msg: 'Please provide name and description' });
        }

        const newClub = new Club({
            name,
            description,
            organizer: req.user.id,
            imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined,
            category,
            followers: [],
            followerCount: 0
        });

        await newClub.save();
        await newClub.populate('organizer', 'name email');

        res.json(newClub);
    } catch (err) {
        console.error('Create Club Error:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            userId: req.user?.id
        });
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                msg: 'Validation error', 
                errors: Object.values(err.errors).map(e => e.message) 
            });
        }
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Club with this name already exists' });
        }
        
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Get all clubs
exports.getClubs = async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });

        res.json(clubs);
    } catch (err) {
        console.error('Get Clubs Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get club by ID
exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('followers', 'name email');

        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        res.json(club);
    } catch (err) {
        console.error('Get Club Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get clubs by organizer
exports.getClubsByOrganizer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const clubs = await Club.find({ organizer: req.user.id })
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });

        res.json(clubs);
    } catch (err) {
        console.error('Get Clubs By Organizer Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Follow club
exports.followClub = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Check if already following
        if (club.followers.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Already following this club' });
        }

        club.followers.push(req.user.id);
        club.followerCount = club.followers.length;
        await club.save();

        res.json({ msg: 'Successfully followed club', club });
    } catch (err) {
        console.error('Follow Club Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Unfollow club
exports.unfollowClub = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Check if following
        if (!club.followers.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Not following this club' });
        }

        club.followers = club.followers.filter(
            followerId => followerId.toString() !== req.user.id
        );
        club.followerCount = club.followers.length;
        await club.save();

        res.json({ msg: 'Successfully unfollowed club', club });
    } catch (err) {
        console.error('Unfollow Club Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get clubs user is following
exports.getFollowedClubs = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        const clubs = await Club.find({ followers: req.user.id })
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });

        res.json(clubs);
    } catch (err) {
        console.error('Get Followed Clubs Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get events by club
exports.getClubEvents = async (req, res) => {
    try {
        const clubId = req.params.id;
        const club = await Club.findById(clubId);
        
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        const events = await Event.find({ club: clubId })
            .populate('organizer', 'name email')
            .populate('club', 'name')
            .sort({ date: 1 });

        res.json(events);
    } catch (err) {
        console.error('Get Club Events Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Update club
exports.updateClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Check if user is the organizer
        if (club.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this club' });
        }

        const { name, description, imageUrl, category } = req.body;

        if (name) club.name = name;
        if (description) club.description = description;
        if (imageUrl !== undefined) {
            club.imageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : undefined;
        }
        if (category) club.category = category;

        await club.save();
        await club.populate('organizer', 'name email');

        res.json(club);
    } catch (err) {
        console.error('Update Club Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Delete club
exports.deleteClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ msg: 'Club not found' });
        }

        // Check if user is the organizer
        if (club.organizer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this club' });
        }

        // Delete all events associated with this club
        await Event.deleteMany({ club: req.params.id });

        await Club.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Club deleted successfully' });
    } catch (err) {
        console.error('Delete Club Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

