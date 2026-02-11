// courseManager.js - 课程管理工具类（优化版本）

class CourseManager {
  constructor() {
    this.courses = [];
    this.userId = null;
  }

  init(userId) {
    this.userId = userId;
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (!this.userId) return;
    this.courses = wx.getStorageSync(`courses_${this.userId}`) || [];
  }

  saveToStorage() {
    if (this.userId) wx.setStorageSync(`courses_${this.userId}`, this.courses);
  }

  getAllCourses() {
    return this.courses;
  }

  getCoursesByWeek(week) {
    return this.courses.filter(course =>
      course.timeSlots.some(slot => {
        if (week < slot.startWeek || week > slot.endWeek) return false;
        if (slot.oddEven === 1 && week % 2 === 0) return false;
        if (slot.oddEven === 2 && week % 2 === 1) return false;
        return true;
      })
    );
  }

  getCoursesByDay(weekday) {
    return this.courses.filter(course =>
      course.timeSlots.some(slot => slot.weekday === weekday)
    );
  }

  addCourse(courseData) {
    const course = {
      id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const conflicts = this.checkConflicts(course);
    if (conflicts.length > 0) {
      return { success: false, conflicts, message: '检测到时间冲突' };
    }

    this.courses.push(course);
    this.saveToStorage();
    return { success: true, course };
  }

  updateCourse(courseId, courseData) {
    const index = this.courses.findIndex(c => c.id === courseId);
    if (index === -1) return { success: false, message: '课程不存在' };

    const updatedCourse = {
      ...this.courses[index],
      ...courseData,
      id: courseId,
      updatedAt: new Date().toISOString()
    };

    const conflicts = this.checkConflicts(updatedCourse, courseId);
    if (conflicts.length > 0) {
      return { success: false, conflicts, message: '检测到时间冲突' };
    }

    this.courses[index] = updatedCourse;
    this.saveToStorage();
    return { success: true, course: updatedCourse };
  }

  deleteCourse(courseId) {
    const index = this.courses.findIndex(c => c.id === courseId);
    if (index === -1) return { success: false, message: '课程不存在' };

    this.courses.splice(index, 1);
    this.saveToStorage();
    return { success: true };
  }

  deleteCourses(courseIds) {
    const initialLength = this.courses.length;
    this.courses = this.courses.filter(c => !courseIds.includes(c.id));
    this.saveToStorage();
    return { success: true, deletedCount: initialLength - this.courses.length };
  }

  checkConflicts(newCourse, excludeCourseId = null) {
    const conflicts = [];

    this.courses.forEach(existingCourse => {
      if (excludeCourseId && existingCourse.id === excludeCourseId) return;

      newCourse.timeSlots.forEach(newSlot => {
        existingCourse.timeSlots.forEach(existingSlot => {
          if (newSlot.weekday !== existingSlot.weekday) return;

          const sectionOverlap = !(newSlot.endSection < existingSlot.startSection ||
            newSlot.startSection > existingSlot.endSection);
          if (!sectionOverlap) return;

          if (this.checkWeekOverlap(existingSlot, newSlot)) {
            conflicts.push({ existingCourse: existingCourse.name, existingSlot, newSlot });
          }
        });
      });
    });

    return conflicts;
  }

  checkWeekOverlap(slot1, slot2) {
    const rangeOverlap = !(slot1.endWeek < slot2.startWeek ||
      slot1.startWeek > slot2.endWeek);
    if (!rangeOverlap) return false;

    if (slot1.oddEven === 0 || slot2.oddEven === 0) return true;
    if (slot1.oddEven === slot2.oddEven) return true;

    return false;
  }

  generateShareCode(courseIds) {
    const shareCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const coursesToShare = this.courses.filter(c => courseIds.includes(c.id));

    wx.setStorageSync(`share_${shareCode}`, {
      code: shareCode,
      courses: coursesToShare,
      createdAt: new Date().toISOString(),
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return shareCode;
  }

  importCourses(shareCode) {
    const shareData = wx.getStorageSync(`share_${shareCode}`);

    if (!shareData) return { success: false, message: '分享码无效或已过期' };
    if (new Date() > new Date(shareData.expireAt)) {
      return { success: false, message: '分享码已过期' };
    }

    const importedCourses = [];
    const conflicts = [];

    shareData.courses.forEach(course => {
      const { id, ...courseData } = course;
      const result = this.addCourse(courseData);
      if (result.success) {
        importedCourses.push(result.course);
      } else {
        conflicts.push(...result.conflicts);
      }
    });

    return { success: true, importedCount: importedCourses.length, conflicts };
  }

  convertToGrid(week = null) {
    const grid = [[], [], [], [], [], [], []];
    const courses = week ? this.getCoursesByWeek(week) : this.courses;

    courses.forEach(course => {
      course.timeSlots.forEach(slot => {
        if (week !== null) {
          if (week < slot.startWeek || week > slot.endWeek) return;
          if (slot.oddEven === 1 && week % 2 === 0) return;
          if (slot.oddEven === 2 && week % 2 === 1) return;
        }

        const dayIndex = slot.weekday - 1;
        for (let i = slot.startSection - 1; i < slot.endSection; i++) {
          if (!grid[dayIndex][i]) {
            grid[dayIndex][i] = { ...course, currentSlot: slot };
          }
        }
      });
    });

    return grid;
  }
}

module.exports = new CourseManager();
