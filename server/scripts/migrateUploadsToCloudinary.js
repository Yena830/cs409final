#!/usr/bin/env node

/**
 * 迁移本地上传文件到Cloudinary
 * 此脚本会将 uploads/ 目录中的所有图片文件上传到Cloudinary
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

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

// 获取上传目录路径
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// 支持的图片格式
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

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
    
    console.log('\n迁移完成!');
    console.log(`成功: ${successCount} 个文件`);
    console.log(`失败: ${errorCount} 个文件`);
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 执行迁移
console.log('开始迁移本地上传文件到Cloudinary...');
migrateFiles();