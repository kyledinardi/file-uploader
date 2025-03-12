const asyncHandler = require('express-async-handler');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.shareFormGet = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.folderId) },
  });

  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    return next(err);
  }

  return res.render('share', {
    title: `Share ${folder.isIndex ? 'all of your folders' : folder.name}`,
    folderId: req.params.folderId,
  });
});

exports.shareFormPost = asyncHandler(async (req, res, next) => {
  const multiplier = req.body.timeUnit === 'days' ? 24 : 1;

  const expireDate = new Date(
    Date.now() + req.body.duration * 1000 * 60 * 60 * multiplier,
  );

  const newShare = await prisma.share.create({ data: { expires: expireDate } });
  const updates = [];

  async function addDescendantsToShare(folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { childFolders: true, files: true },
    });

    const childFolderIds = folder.childFolders.map((child) => ({
      id: child.id,
    }));

    const fileConnections = folder.files.map((file) => ({ id: file.id }));

    updates.push(
      prisma.share.update({
        where: { id: newShare.id },

        data: {
          folders: { connect: childFolderIds },
          files: { connect: fileConnections },
        },
      }),
    );

    folder.childFolders.forEach((child) => addDescendantsToShare(child.id));
  }

  const rootFolder = await prisma.folder.findUnique({
    where: { id: Number(req.params.folderId) },
    include: { childFolders: true, files: true },
  });

  updates.push(
    prisma.share.update({
      where: { id: newShare.id },
      data: { folders: { connect: { id: rootFolder.id } } },
    }),
  );

  await addDescendantsToShare(rootFolder.id);
  await Promise.all(updates);

  return res.redirect(
    rootFolder.isIndex ? '/' : `/folders/${req.params.folderId}`,
  );
});

exports.shareFolderGet = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.folderId) },

    include: {
      childFolders: true,
      files: true,
      shares: { where: { id: req.params.uuid } },
    },
  });

  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    return next(err);
  }

  if (req.user.id === folder.userId) {
    return res.redirect(folder.isIndex ? '/' : `/folders/${folder.id}`);
  }

  if (Date.now() > folder.shares[0].expires.getTime()) {
    const err = new Error('Share link expired');
    err.status = 403;
    return next(err);
  }

  return res.render('folder', {
    title: folder.name,
    folder,
    childFolders: folder.childFolders,
    files: folder.files,
    isShared: true,
  });
});

exports.shareDownload = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.fileId) },
    include: { shares: true },
  });

  if (!file) {
    const err = new Error('File not found');
    err.status = 404;
    return next(err);
  }

  if (req.user.id === file.userId) {
    return res.redirect(`/files/${file.id}`);
  }

  if (Date.now() > file.shares[0].expires.getTime()) {
    const err = new Error('Share link expired');
    err.status = 403;
    return next(err);
  }

  return res.redirect(file.url);
});

exports.shareUpDirectory = asyncHandler(async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: { id: Number(req.params.folderId) },
    include: { parentFolder: true, shares: { where: { id: req.params.uuid } } },
  });

  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    return next(err);
  }

  if (req.user.id === folder.userId) {
    return res.redirect(folder.isIndex ? '/' : `/folders/${folder.id}`);
  }

  if (Date.now() > folder.shares[0].expires.getTime()) {
    const err = new Error('Share link expired');
    err.status = 403;
    return next(err);
  }

  if (folder.isIndex) {
    return res.redirect(`/shares/${req.params.uuid}/folders/${folder.id}`);
  }

  return res.redirect(
    `/shares/${req.params.uuid}/folders/${folder.parentFolderId}`,
  );
});
