const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  iconName: { type: String, default: 'book' },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model('Category', categorySchema);
