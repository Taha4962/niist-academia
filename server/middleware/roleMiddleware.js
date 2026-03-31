const checkHOD = (req, res, next) => {
  if (req.user && req.user.is_hod === true) {
    return next();
  }
  return res.status(403).json({ message: 'HOD access required' });
};

const checkFaculty = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') {
    return next();
  }
  return res.status(403).json({ message: 'Faculty access required' });
};

const checkStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({ message: 'Student access required' });
};

module.exports = {
  checkHOD,
  checkFaculty,
  checkStudent,
};
