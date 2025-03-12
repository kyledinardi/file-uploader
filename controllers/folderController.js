const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const folderInclusions = {
  childFolders: true,
  files: true,
  shares: { orderBy: { expires: 'desc' }, take: 1 },
};

function checkFolder(folder, userId, action) {
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    return err;
  }

  if (folder.userId !== userId) {
    const err = new Error('Unauthorized user');
    err.status = 403;
    return err;
  }

  if (action && folder.isIndex) {
    const err = new Error(`Cannot ${action} index`);
    err.status = 403;
    return err;
  }

  return null;
}

exports.createFolder = [
  body('folderName')
    .trim()
    .notEmpty()
    .withMessage('Folder name must not be empty')
    .not()
    .matches(/[\\/:*?<>|]/)
    .withMessage('Folder name must not include \\ / : * ? < > or |'),

  asyncHandler(async (req, res, next) => {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: Number(req.params.id) },
      include: { shares: true },
    });

    const parentFolderErr = checkFolder(parentFolder, req.user.id);

    if (parentFolderErr) {
      return next(parentFolderErr);
    }

    const folderAlreadyExists = await prisma.folder.findFirst({
      where: {
        userId: req.user.id,
        path: `${parentFolder.path}${req.body.folderName}/`,
      },
    });

    if (folderAlreadyExists) {
      const err = new Error('Folder already exists');
      err.status = 409;
      return next(err);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('folder', {
        title: parentFolder.name,
        parentFolder,
        childFolders: parentFolder.childFolders,
        files: parentFolder.files,
        isShared: false,
        folderNameErrors: errors.array(),
      });
    }

    const newFolder = await prisma.folder.create({
      data: {
        name: req.body.folderName,
        path: `${parentFolder.path}${req.body.folderName}/`,
      },
    });

    const shareConnections = parentFolder.shares.map((share) => ({
      id: share.id,
    }));

    await Promise.all([
      prisma.user.update({
        where: { id: req.user.id },
        data: { folders: { connect: { id: newFolder.id } } },
      }),

      prisma.folder.update({
        where: { id: parentFolder.id },
        data: { childFolders: { connect: { id: newFolder.id } } },
      }),

      prisma.folder.update({
        where: { id: newFolder.id },
        data: { shares: { connect: shareConnections } },
      }),
    ]);

    return res.redirect(
      parentFolder.isIndex ? '/' : `/folders/${req.params.id}`,
    );
  }),
];

exports.index = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findFirst({
    where: { userId: req.user.id, isIndex: true },
    include: folderInclusions,
  });

  const err = checkFolder(folder, req.user.id);

  if (err) {
    return next(err);
  }

  return res.render('folder', {
    title: folder.name,
    folder,
    childFolders: folder.childFolders,
    files: folder.files,
    isShared: false,
  });
});

exports.getFolder = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
    include: folderInclusions,
  });

  const err = checkFolder(folder, req.user.id);

  if (err) {
    return next(err);
  }

  if (folder.isIndex) {
    return res.redirect('/');
  }

  return res.render('folder', {
    title: folder.name,
    folder,
    childFolders: folder.childFolders,
    files: folder.files,
    isShared: false,
  });
});

exports.upDirectory = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
    include: { parentFolder: true },
  });

  const err = checkFolder(folder, req.user.id);

  if (err) {
    return next(err);
  }

  if (folder.isIndex || folder.parentFolder.isIndex) {
    return res.redirect('/');
  }

  return res.redirect(`/folders/${folder.parentFolderId}`);
});

exports.updateFolderGet = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
  });

  const err = checkFolder(folder, req.user.id, 'edit');

  if (err) {
    return next(err);
  }

  return res.render('edit', { title: 'Edit Folder', name: folder.name });
});

exports.updateFolderPost = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
  });

  const err = checkFolder(folder, req.user.id, 'edit');

  if (err) {
    return next(err);
  }

  const pathParts = folder.path.split('/');
  pathParts[pathParts.length - 2] = req.body.name;
  const newPath = pathParts.join('/');

  await prisma.folder.update({
    where: { id: folder.id },
    data: { name: req.body.name, path: newPath, updated: new Date() },
  });

  return res.redirect('/');
});

exports.deleteFolderGet = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
  });

  const err = checkFolder(folder, req.user.id, 'delete');

  if (err) {
    return next(err);
  }

  return res.render('delete', {
    title: 'Delete Folder?',
    name: folder.name,
    folder,
  });
});

exports.deleteFolderPost = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.id) },
  });

  const err = checkFolder(folder, req.user.id, 'delete');

  if (err) {
    return next(err);
  }

  await prisma.folder.delete({ where: { id: folder.id } });

  return res.redirect(
    folder.parentFolderId ? `/folders/${folder.parentFolderId}` : '/',
  );
});
