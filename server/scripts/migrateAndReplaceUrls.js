#!/usr/bin/env node

/**
 * 迁移本地上传文件到Cloudinary并更新数据库中的URL
 * 此脚本会将 uploads/ 目录中的所有图片文件上传到Cloudinary，
 * 并更新数据库中对应的图片URL
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 加载环境变量
dotenv.config({ path: path.resolve('./server/.env') });

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 检查Cloudinary配置
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('错误: 请在 .env 文件中配置Cloudinary环境变量');
  console.error('需要配置: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('错误: 请在 .env 文件中配置MONGODB_URI');
  process.exit(1);
}

// 连接到MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ 成功连接到MongoDB');
  } catch (error) {
    console.error('✗ 连接MongoDB失败:', error.message);
    process.exit(1);
  }
}

// 导入模型
let User, Pet;
async function importModels() {
  try {
    User = (await import('../models/user.js')).default;
    Pet = (await import('../models/pet.js')).default;
    console.log('✓ 成功加载数据模型');
  } catch (error) {
    console.error('✗ 加载数据模型失败:', error.message);
    process.exit(1);
  }
}

// 获取上传目录路径
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// 支持的图片格式
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

// 存储文件映射关系
const fileMapping = new Map();

async function migrateFiles() {
  try {
    // 检查上传目录是否存在
    if (!fs.existsSync(uploadDir)) {
      console.log(`上传目录不存在: ${uploadDir}`);
      return;
    }

    // 读取目录中的所有文件
    const files = fs.readdirSync(uploadDir);
    
    if (files.length === 0) {
      console.log('上传目录中没有文件');
      return;
    }

    console.log(`找到 ${files.length} 个文件，开始迁移...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 遍历所有文件
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const ext = path.extname(file).toLowerCase();
      
      // 只处理图片文件
      if (imageExtensions.includes(ext)) {
        try {
          console.log(`正在上传: ${file}`);
          
          // 上传到Cloudinary
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'pawfectmatch_uploads',
            public_id: path.parse(file).name,
            overwrite: false, // 不覆盖已存在的文件
            invalidate: true, // 使CDN缓存失效
          });
          
          // 保存映射关系
          const localUrl = `/uploads/${file}`;
          fileMapping.set(localUrl, result.secure_url);
          
          console.log(`✓ 成功上传: ${file} -> ${result.secure_url}`);
          successCount++;
        } catch (error) {
          console.error(`✗ 上传失败: ${file}`, error.message);
          errorCount++;
        }
      } else {
        console.log(`跳过非图片文件: ${file}`);
      }
    }
    
    console.log(`\n文件迁移完成!`);
    console.log(`成功: ${successCount} 个文件`);
    console.log(`失败: ${errorCount} 个文件`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('迁移文件过程中发生错误:', error.message);
    return false;
  }
}

async function updateDatabaseUrls() {
  if (fileMapping.size === 0) {
    console.log('没有文件需要更新数据库URL');
    return;
  }

  console.log(`\n开始更新数据库中的图片URL...`);
  
  let userUpdates = 0;
  let petUpdates = 0;
  
  try {
    // 更新用户头像URL
    for (const [localUrl, cloudinaryUrl] of fileMapping.entries()) {
      // 查找包含本地URL的用户
      const users = await User.find({ profilePhoto: { $regex: localUrl } });
      
      for (const user of users) {
        const updatedUrl = user.profilePhoto.replace(localUrl, cloudinaryUrl);
        await User.findByIdAndUpdate(user._id, { profilePhoto: updatedUrl });
        console.log(`✓ 更新用户 ${user.username} 的头像URL: ${localUrl} -> ${cloudinaryUrl}`);
        userUpdates++;
      }
      
      // 查找包含本地URL的宠物
      const pets = await Pet.find({ photos: { $regex: localUrl } });
      
      for (const pet of pets) {
        const updatedPhotos = pet.photos.map(photo => 
          photo.includes(localUrl) ? photo.replace(localUrl, cloudinaryUrl) : photo
        );
        await Pet.findByIdAndUpdate(pet._id, { photos: updatedPhotos });
        console.log(`✓ 更新宠物 ${pet.name} 的照片URL: ${localUrl} -> ${cloudinaryUrl}`);
        petUpdates++;
      }
    }
    
    console.log(`\n数据库URL更新完成!`);
    console.log(`更新了 ${userUpdates} 个用户记录`);
    console.log(`更新了 ${petUpdates} 个宠物记录`);
    
  } catch (error) {
    console.error('更新数据库URL过程中发生错误:', error.message);
  }
}

async function main() {
  console.log('开始迁移本地上传文件到Cloudinary并更新数据库URL...\n');
  
  // 连接数据库
  await connectDB();
  
  // 导入模型
  await importModels();
  
  // 迁移文件
  const hasMigrated = await migrateFiles();
  
  if (hasMigrated) {
    // 更新数据库URL
    await updateDatabaseUrls();
  }
  
  // 断开数据库连接
  await mongoose.connection.close();
  
  console.log('\n所有操作完成!');
}

// 执行主函数
main().catch(error => {
  console.error('执行过程中发生错误:', error);
  process.exit(1);
});