const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { unlink } = require('fs/promises');
const { PrismaClient } = require('@prisma/client');

const storage = multer.diskStorage({
  destination: 'temp/',
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage, limits: { fileSize: 1e7 } });
const prisma = new PrismaClient();

function checkFile(file, userId) {
  if (!file) {
    const err = new Error('File not found');
    err.status = 404;
    return err;
  }

  if (file.userId !== userId) {
    const err = new Error('Unauthorized user');
    err.status = 403;
    return err;
  }

  return null;
}

exports.upload = [
  upload.single('file'),

  asyncHandler(async (req, res, next) => {
    const result = await cloudinary.uploader.upload(req.file.path);
    await unlink(req.file.path);

    const fileAlreadyExists = await prisma.file.findFirst({
      where: {
        name: req.file.filename,
        userId: req.user.id,
        folderId: Number(req.params.folderId),
      },
    });

    if (fileAlreadyExists) {
      const err = new Error('File already exists');
      err.status = 409;
      return next(err);
    }

    const file = await prisma.file.create({
      data: {
        name: req.file.filename,
        url: result.secure_url,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });

    const [folder] = await Promise.all([
      prisma.folder.update({
        where: { id: Number(req.params.folderId) },
        data: { files: { connect: { id: file.id } } },
        include: { shares: true },
      }),

      prisma.user.update({
        where: { id: req.user.id },
        data: { files: { connect: { id: file.id } } },
      }),
    ]);

    const shareConnections = folder.shares.map((share) => ({ id: share.id }));

    await prisma.file.update({
      where: { id: file.id },
      data: { shares: { connect: shareConnections } },
    });

    return res.redirect(folder.isIndex ? '/' : `/folders/${req.params.id}`);
  }),
];

exports.download = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.id) },
    include: { shares: true },
  });

  const err = checkFile(file, req.user.id);

  if (err) {
    return next(err);
  }

  return res.redirect(file.url);
});

exports.updateFileGet = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.id) },
  });

  const err = checkFile(file, req.user.id);

  if (err) {
    return next(err);
  }

  return res.render('edit', {
    title: 'Edit File',
    name: path.parse(file.name).name,
    extension: path.parse(file.name).ext,
  });
});

exports.updateFilePost = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.id) },
    include: { folder: true },
  });

  const err = checkFile(file, req.user.id);

  if (err) {
    return next(err);
  }

  await prisma.file.update({
    where: { id: file.id },
    data: { name: `${req.body.name}${req.body.extension}` },
  });

  return res.redirect(file.folder.isIndex ? '/' : `/folders/${file.folderId}`);
});

exports.deleteFileGet = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.id) },
    include: { folder: true },
  });

  const err = checkFile(file, req.user.id);

  if (err) {
    return next(err);
  }

  return res.render('delete', {
    title: 'Delete File?',
    name: file.name,
    folder: file.folder,
  });
});

exports.deleteFilePost = asyncHandler(async (req, res, next) => {
  const file = await prisma.file.findUnique({
    where: { id: Number(req.params.id) },
    include: { folder: true },
  });

  const err = checkFile(file, req.user.id);

  if (err) {
    return next(err);
  }

  await prisma.file.delete({ where: { id: file.id } });
  return res.redirect(file.folder.isIndex ? '/' : `/folders/${file.folderId}`);
});
