import mongoose from 'mongoose';
const { Schema } = mongoose;
const CaseSchema = new Schema({
  playerId: { type: String, required: true, index: true }, title: String, scenario: String, story: String, setting: String,
  status: { type: String, default: 'ready' }, suspects: [Schema.Types.Mixed], evidence: [Schema.Types.Mixed], timeline: [Schema.Types.Mixed],
  solution: { type: Schema.Types.Mixed, select: false }
}, { timestamps: true });
const AttemptSchema = new Schema({ caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true }, playerId: { type: String, required: true }, selectedSuspectId: String, isCorrect: Boolean, submittedAt: { type: Date, default: Date.now } });
AttemptSchema.index({ caseId: 1, playerId: 1 }, { unique: true });
export const Case = mongoose.model('Case', CaseSchema);
export const Attempt = mongoose.model('Attempt', AttemptSchema);
export const mongoRepository = {
  createCase: data => Case.create(data).then(d => d.toObject()),
  getCase: (id, playerId) => Case.findOne({ _id: id, playerId }).select('+solution').lean(),
  getAttempt: (caseId, playerId) => Attempt.findOne({ caseId, playerId }).lean(),
  createAttempt: data => Attempt.create(data).then(d => d.toObject()),
  async history(playerId) {
    const attempts = await Attempt.find({ playerId }).sort({ submittedAt: -1 }).limit(100).lean();
    const cases = await Case.find({ _id: { $in: attempts.map(a => a.caseId) }, playerId }).select('title').lean();
    return attempts.map(a => ({ ...a, title: cases.find(c => String(c._id) === String(a.caseId))?.title || 'Archived case' }));
  }
};
