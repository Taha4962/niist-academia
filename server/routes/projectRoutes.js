const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkHOD, checkStudent } = require('../middleware/roleMiddleware');
const projectController = require('../controllers/projectController');
const { getStudentProject } = require('../controllers/studentProjectController');

router.use(authMiddleware);

// HOD route first to avoid param conflict
router.get('/hod/overview', checkHOD, projectController.getHodOverview);
// Student self route
router.get('/student/self', checkStudent, getStudentProject);

// Faculty: list students in a session (for building project teams)
router.get('/session-students/:session_id', checkFaculty, projectController.getSessionStudents);

// Milestone and team sub-routes (specific before generic params)
router.put('/milestones/:milestone_id', checkFaculty, projectController.updateMilestone);
router.delete('/milestones/:milestone_id', checkFaculty, projectController.deleteMilestone);
router.put('/teams/:team_id', checkFaculty, projectController.updateTeam);
router.post('/teams/:team_id/members', checkFaculty, projectController.addMember);
router.delete('/teams/:team_id/members/:student_id', checkFaculty, projectController.removeMember);

// Project level
router.get('/:session_id', projectController.getProjects);
router.post('/', checkFaculty, projectController.createProject);
router.put('/:project_id/toggle', checkFaculty, projectController.toggleProject);
router.put('/:project_id', checkFaculty, projectController.updateProject);
router.get('/:project_id/teams', projectController.getTeams);
router.post('/:project_id/teams', checkFaculty, projectController.createTeam);
router.get('/:project_id/milestones', projectController.getMilestones);
router.post('/:project_id/milestones', checkFaculty, projectController.createMilestones);

module.exports = router;
