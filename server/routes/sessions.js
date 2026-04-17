// routes/sessions.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { create, getAll, getById } = require('../controllers/sessionController');
router.use(auth);                      // all routes below require token
router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
module.exports = router;