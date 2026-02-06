const { WordPathWord, WordPathDaily, WordPathAttempt } = require('../models/WordPath');
const User = require('../models/User');

/**
 * Find a Hamiltonian Path on a 4x4 grid using Backtracking
 */
const findHamiltonianPath = (size) => {
    const grid = Array(size).fill(0).map(() => Array(size).fill(false));
    const path = [];

    const solve = (r, c, depth) => {
        if (depth === size * size) return true;

        const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);

        for (const [dr, dc] of moves) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !grid[nr][nc]) {
                grid[nr][nc] = true;
                path.push({ r: nr, c: nc });
                if (solve(nr, nc, depth + 1)) return true;
                path.pop();
                grid[nr][nc] = false;
            }
        }
        return false;
    };

    // Try multiple start positions until a path is found
    const starts = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) starts.push({ r, c });
    starts.sort(() => Math.random() - 0.5);

    for (const start of starts) {
        grid[start.r][start.c] = true;
        path.push(start);
        if (solve(start.r, start.c, 1)) return path;
        path.pop();
        grid[start.r][start.c] = false;
    }
    return null;
};

// @desc    Get candidates for today
exports.getDailyCandidates = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let daily = await WordPathDaily.findOne({ date: today }).populate('candidates');

        if (!daily) {
            // Pick exactly 5 random words from the bank
            const selection = await WordPathWord.aggregate([{ $sample: { size: 5 } }]);

            daily = await WordPathDaily.create({
                date: today,
                candidates: selection.map(w => w._id),
                status: 'pending'
            });
            await daily.populate('candidates');
        }

        res.json(daily);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin selects the word and generates the puzzle
exports.selectDailyWord = async (req, res) => {
    try {
        const { wordId } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const daily = await WordPathDaily.findOne({ date: today });
        if (!daily) return res.status(404).json({ message: 'Daily record not found' });
        if (daily.status === 'active') return res.status(400).json({ message: 'Puzzle already active' });

        const wordObj = await WordPathWord.findById(wordId);
        const wordArr = wordObj.word.split('');

        let path = null;
        let attempts = 0;
        while (!path && attempts < 50) {
            path = findHamiltonianPath(4);
            attempts++;
        }
        if (!path) throw new Error('Failed to generate high-quality path');

        // Map word letters to path as checkpoints
        // We want to distributed letters across the 16 steps
        const targetWordIndices = [];
        const stepSize = Math.floor(16 / wordArr.length);
        for (let i = 0; i < wordArr.length; i++) {
            // Place each letter at roughly equal intervals to ensure the path is traced fully
            targetWordIndices.push(i * stepSize);
        }

        // Create Grid
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const grid = Array(16).fill(null).map((_, i) => {
            const letterIdx = targetWordIndices.indexOf(i);
            const letter = letterIdx !== -1 ? wordArr[letterIdx] : alphabet[Math.floor(Math.random() * 26)];
            return {
                letter,
                r: path[i].r,
                c: path[i].c,
                isCheckpoint: letterIdx !== -1,
                checkpointIndex: letterIdx !== -1 ? letterIdx + 1 : null
            };
        });

        daily.selectedWord = wordId;
        daily.grid = grid;
        daily.correctPath = path;
        daily.targetWordIndices = targetWordIndices;
        daily.status = 'active';
        await daily.save();

        res.json(daily);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get today's puzzle for user
exports.getTodayPuzzle = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const daily = await WordPathDaily.findOne({ date: today, status: 'active' }).populate('selectedWord');

        if (!daily) return res.status(404).json({ message: 'ಇಂದಿನ ಸವಾಲು ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ (Today\'s challenge not ready)' });

        const attempt = await WordPathAttempt.findOne({ userId: req.user._id, date: today });

        res.json({
            _id: daily._id,
            grid: daily.grid,
            targetWord: daily.selectedWord.word,
            category: daily.selectedWord.category,
            difficulty: daily.selectedWord.difficulty,
            explanation: daily.selectedWord.explanation,
            attempted: !!attempt,
            attemptStatus: attempt ? attempt.status : null,
            userPath: attempt ? attempt.userPath : null,
            correctPath: attempt ? daily.correctPath : null // Only show if attempted
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit attempt
exports.submitAttempt = async (req, res) => {
    try {
        const { dailyId, userPath, duration } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const daily = await WordPathDaily.findById(dailyId);
        if (!daily) return res.status(404).json({ message: 'Puzzle not found' });

        const existing = await WordPathAttempt.findOne({ userId: req.user._id, date: today });
        if (existing) return res.status(400).json({ message: 'Already attempted today' });

        // Simple path verification
        let isCorrect = true;
        if (userPath.length !== daily.correctPath.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < userPath.length; i++) {
                if (userPath[i].r !== daily.correctPath[i].r || userPath[i].c !== daily.correctPath[i].c) {
                    isCorrect = false;
                    break;
                }
            }
        }

        const attempt = await WordPathAttempt.create({
            userId: req.user._id,
            dailyId,
            userPath,
            status: isCorrect ? 'correct' : 'wrong',
            duration,
            date: today
        });


        const updatedUser = await User.findById(req.user._id);

        res.json({
            isCorrect,
            correctPath: daily.correctPath
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin stats
exports.getStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const daily = await WordPathDaily.findOne({ date: today }).populate('selectedWord');
        if (!daily) return res.json({});

        const attempts = await WordPathAttempt.find({ dailyId: daily._id });
        const successCount = attempts.filter(a => a.status === 'correct').length;

        res.json({
            daily,
            totalAttempts: attempts.length,
            successRate: attempts.length > 0 ? ((successCount / attempts.length) * 100).toFixed(2) : 0,
            avgTime: attempts.length > 0 ? (attempts.reduce((acc, current) => acc + (current.duration || 0), 0) / attempts.length).toFixed(1) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Admin resets today's puzzle
exports.resetDaily = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        await WordPathDaily.findOneAndDelete({ date: today });
        await WordPathAttempt.deleteMany({ date: today });
        res.json({ message: 'Today\'s puzzle has been reset' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
