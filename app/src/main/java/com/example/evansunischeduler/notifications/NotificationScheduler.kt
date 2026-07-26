package com.example.evansunischeduler.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.example.evansunischeduler.data.Course
import com.example.evansunischeduler.data.StudySession
import java.util.Calendar

class NotificationScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun scheduleCourseNotification(course: Course, notifyMinutesBefore: Int) {
        // Start Alarm
        val startIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Next Up!")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans! Your next class is ${course.name} in ${notifyMinutesBefore} minutes.")
        }
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.toInt(),
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // End Alarm
        val endIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Class Closed")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans, your class ${course.name} is now closed!")
        }
        val endPendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.toInt() + 50000,
            endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val javaDow = if (course.dayOfWeek == 7) Calendar.SUNDAY else course.dayOfWeek + 1

        val startCalendar = Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, javaDow)
            set(Calendar.HOUR_OF_DAY, course.startHour)
            set(Calendar.MINUTE, course.startMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        startCalendar.add(Calendar.MINUTE, -notifyMinutesBefore)
        if (startCalendar.timeInMillis <= System.currentTimeMillis()) startCalendar.add(Calendar.DAY_OF_YEAR, 7)

        val endCalendar = Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, javaDow)
            set(Calendar.HOUR_OF_DAY, course.endHour)
            set(Calendar.MINUTE, course.endMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (endCalendar.timeInMillis <= System.currentTimeMillis()) endCalendar.add(Calendar.DAY_OF_YEAR, 7)

        try {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, startCalendar.timeInMillis, startPendingIntent)
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endCalendar.timeInMillis, endPendingIntent)
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun cancelCourseNotification(course: Course) {
        val startIntent = Intent(context, AlarmReceiver::class.java)
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.toInt(),
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val endIntent = Intent(context, AlarmReceiver::class.java)
        val endPendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.toInt() + 50000,
            endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(startPendingIntent)
        alarmManager.cancel(endPendingIntent)
    }

    fun scheduleStudySessionNotification(session: StudySession, notifyMinutesBefore: Int) {
        // Start Alarm
        val startIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Study Session")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans! It's almost time to study for ${session.courseName}.")
        }
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            session.id.toInt() + 100000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Break Alarm (Halfway through)
        val breakIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Study Break")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans, it's time to take a quick break from studying!")
        }
        val breakPendingIntent = PendingIntent.getBroadcast(
            context,
            session.id.toInt() + 150000,
            breakIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val startCalendar = Calendar.getInstance().apply {
            timeInMillis = session.dateMillis
            set(Calendar.HOUR_OF_DAY, session.startHour)
            set(Calendar.MINUTE, session.startMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        
        val breakCalendar = startCalendar.clone() as Calendar
        breakCalendar.add(Calendar.MINUTE, session.durationMinutes / 2)

        startCalendar.add(Calendar.MINUTE, -notifyMinutesBefore)

        try {
            if (startCalendar.timeInMillis > System.currentTimeMillis()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, startCalendar.timeInMillis, startPendingIntent)
            }
            if (breakCalendar.timeInMillis > System.currentTimeMillis()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, breakCalendar.timeInMillis, breakPendingIntent)
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun cancelStudySessionNotification(session: StudySession) {
        val startIntent = Intent(context, AlarmReceiver::class.java)
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            session.id.toInt() + 100000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val breakIntent = Intent(context, AlarmReceiver::class.java)
        val breakPendingIntent = PendingIntent.getBroadcast(
            context,
            session.id.toInt() + 150000,
            breakIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(startPendingIntent)
        alarmManager.cancel(breakPendingIntent)
    }

    fun scheduleExamNotification(exam: com.example.evansunischeduler.data.Exam, notifyMinutesBefore: Int) {
        // Immediate Reminder (Minutes before)
        val startIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Exam Reminder")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans! Good luck on your ${exam.courseName} ${exam.examTitle} in $notifyMinutesBefore minutes! 🎓")
        }
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 200000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val startCalendar = Calendar.getInstance().apply { timeInMillis = exam.timestampMillis }
        startCalendar.add(Calendar.MINUTE, -notifyMinutesBefore)

        // 1 Day Before Reminder
        val oneDayIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Exam Tomorrow!")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans! Your ${exam.courseName} exam is tomorrow! Make sure you do your final reviews and get some good rest! 🚀")
        }
        val oneDayPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 300000,
            oneDayIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val oneDayCalendar = Calendar.getInstance().apply { timeInMillis = exam.timestampMillis }
        oneDayCalendar.add(Calendar.DAY_OF_YEAR, -1)

        // 3 Days Before Reminder
        val threeDayIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("EXTRA_TITLE", "Exam Approaching")
            putExtra("EXTRA_MESSAGE", "Hey this is Evans! Your ${exam.courseName} exam is in 3 days. Time to start focusing and preparing! 📚")
        }
        val threeDayPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 400000,
            threeDayIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val threeDayCalendar = Calendar.getInstance().apply { timeInMillis = exam.timestampMillis }
        threeDayCalendar.add(Calendar.DAY_OF_YEAR, -3)

        try {
            if (startCalendar.timeInMillis > System.currentTimeMillis()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, startCalendar.timeInMillis, startPendingIntent)
            }
            if (oneDayCalendar.timeInMillis > System.currentTimeMillis()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, oneDayCalendar.timeInMillis, oneDayPendingIntent)
            }
            if (threeDayCalendar.timeInMillis > System.currentTimeMillis()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, threeDayCalendar.timeInMillis, threeDayPendingIntent)
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun cancelExamNotification(exam: com.example.evansunischeduler.data.Exam) {
        val startIntent = Intent(context, AlarmReceiver::class.java)
        val startPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 200000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val oneDayPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 300000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val threeDayPendingIntent = PendingIntent.getBroadcast(
            context,
            exam.id.toInt() + 400000,
            startIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(startPendingIntent)
        alarmManager.cancel(oneDayPendingIntent)
        alarmManager.cancel(threeDayPendingIntent)
    }
}
