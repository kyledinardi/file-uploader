# File Uploader

A cloud storage app built with EJS, Express, and PostgreSQL

## Live

todo

## Features

- Create, rename, and delete folders
- Upload, download, rename, and delete files
- Share folders using special links

## Installation

1. Open the termainal and clone the repository to your computer: `git clone git@github.com:kyledinardi/file-uploader.git`
2. Change to the project directory: `cd file-uploader`
3. Install packages: `npm install`
4. Create a .env file in the current directory and add these lines
```
SESSION_SECRET=<any-string-you-want>
CLOUDINARY_URL=<cloudinary-api-url>
DATABASE_URL=<postgresql-url>
```
5. Start the server: `npm start`