#!/usr/bin/env node

/**
 * 更新数据库中的图片URL
 * 将本地URL替换为Cloudinary URL
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 加载环境变量
dotenv.config({ path: path.resolve('./server/.env') });

// 导入模型
import Pet from '../models/pet.js';
import User from '../models/user.js';

async function updateDatabaseUrls() {
  try {
    // 连接到数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');

    // 读取映射文件
    const mappingFilePath = path.join(process.cwd(), 'uploads', 'cloudinary_mapping.json');
    
    if (!fs.existsSync(mappingFilePath)) {
      console.error('映射文件不存在，请先运行 migrate:local-to-cloudinary 脚本');
      process.exit(1);
    }
    
    const mappingData = JSON.parse(fs.readFileSync(mappingFilePath, 'utf8'));
    console.log(`加载了 ${mappingData.length} 个映射关系`);

    // 创建映射对象以便快速查找
    const urlMap = {};
    mappingData.forEach(item => {
      // 从本地文件路径提取文件名
      const fileName = path.basename(item.localPath);
      urlMap[fileName] = item.cloudinaryUrl;
    });

    // 更新Pet模型中的图片URL
    console.log('\n开始更新Pet模型中的图片URL...');
    const pets = await Pet.find({});
    let petUpdatedCount = 0;
    
    for (const pet of pets) {
      let updated = false;
      
      // 更新封面图片
      if (pet.coverPhoto) {
        const fileName = pet.coverPhoto.split('/').pop();
        if (urlMap[fileName]) {
          pet.coverPhoto = urlMap[fileName];
          updated = true;
          console.log(`更新宠物 "${pet.name}" 的封面图片: ${fileName} -> ${urlMap[fileName]}`);
        }
      }
      
      // 更新相册图片
      if (pet.photos && pet.photos.length > 0) {
        for (let i = 0; i < pet.photos.length; i++) {
          const fileName = pet.photos[i].split('/').pop();
          if (urlMap[fileName]) {
            pet.photos[i] = urlMap[fileName];
            updated = true;
            console.log(`更新宠物 "${pet.name}" 的相册图片: ${fileName} -> ${urlMap[fileName]}`);
          }
        }
      }
      
      if (updated) {
        await pet.save();
        petUpdatedCount++;
      }
    }
    
    console.log(`Pet模型更新完成，共更新 ${petUpdatedCount} 个文档`);

    // 更新User模型中的图片URL
    console.log('\n开始更新User模型中的图片URL...');
    const users = await User.find({});
    let userUpdatedCount = 0;
    
    for (const user of users) {
      let updated = false;
      
      // 更新头像
      if (user.profilePhoto) {
        const fileName = user.profilePhoto.split('/').pop();
        if (urlMap[fileName]) {
          user.profilePhoto = urlMap[fileName];
          updated = true;
          console.log(`更新用户 "${user.username}" 的头像: ${fileName} -> ${urlMap[fileName]}`);
        }
      }
      
      if (updated) {
        await user.save();
        userUpdatedCount++;
      }
    }
    
    console.log(`User模型更新完成，共更新 ${userUpdatedCount} 个文档`);

    console.log('\n=== 数据库URL更新完成 ===');
    console.log(`总计更新:`);
    console.log(`  Pet文档: ${petUpdatedCount}`);
    console.log(`  User文档: ${userUpdatedCount}`);
    
    // 断开数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('更新数据库URL时发生错误:', error);
    process.exit(1);
  }
}

// 执行更新
updateDatabaseUrls();