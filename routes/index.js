const express = require('express');
const fileController = require('../controllers/fileController');
const folderController = require('../controllers/folderController');
const shareController = require('../controllers/shareController');
const userController = require('../controllers/userController');

const router = express.Router();
router.get('/login', userController.loginGet);
router.post('/login', userController.loginPost);
router.get('/sign-up', userController.signUpGet);
router.post('/sign-up', userController.signUpPost);
router.get('/logout', userController.logout);

router.get('*', userController.authenticate);
router.get('/shares/shareForm/:folderId', shareController.shareFormGet);
router.post('/shares/shareForm/:folderId', shareController.shareFormPost);
router.get('/shares/:uuid/folders/:folderId', shareController.shareFolderGet);
router.get('/shares/:uuid/files/:fileId', shareController.shareDownload);

router.get(
  '/shares/:uuid/folders/:folderId/up-directory',
  shareController.shareUpDirectory,
);

router.post('/folders/:id/create-folder', folderController.createFolder);
router.get('/', folderController.index);
router.get('/folders/:id', folderController.getFolder);
router.get('/folders/:id/up-directory', folderController.upDirectory);

router.get('/folders/:id/edit', folderController.updateFolderGet);
router.post('/folders/:id/edit', folderController.updateFolderPost);
router.get('/folders/:id/delete', folderController.deleteFolderGet);
router.post('/folders/:id/delete', folderController.deleteFolderPost);

router.post('/files/:folderId/', fileController.upload);
router.get('/files/:id', fileController.download);

router.get('/files/:id/edit', fileController.updateFileGet);
router.post('/files/:id/edit', fileController.updateFilePost);
router.get('/files/:id/delete', fileController.deleteFileGet);
router.post('/files/:id/delete', fileController.deleteFilePost);

module.exports = router;
