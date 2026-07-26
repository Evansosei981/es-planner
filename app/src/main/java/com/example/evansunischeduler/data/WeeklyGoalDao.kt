package com.example.evansunischeduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface WeeklyGoalDao {
    @Query("SELECT * FROM weekly_goals WHERE id = 1")
    fun getGoal(): Flow<WeeklyGoal?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setGoal(goal: WeeklyGoal)
}
