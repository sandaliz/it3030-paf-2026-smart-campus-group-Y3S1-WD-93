package com.sliit.uniops.repository;

import com.sliit.uniops.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    // Find bookings by user
    List<Booking> findByUserId(String userId);
    
    // Find bookings by status (for admin)
    List<Booking> findByStatus(String status);
    
    // Find bookings by resource
    List<Booking> findByResourceId(String resourceId);
    
    // CRITICAL: Conflict checking query - This is your core feature!
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $in: ['PENDING', 'APPROVED'] }, " +
           "$or: [ " +
           "  { 'startTime': { $lt: ?3, $gte: ?2 } }, " +
           "  { 'endTime': { $gt: ?2, $lte: ?3 } }, " +
           "  { 'startTime': { $lte: ?2 }, 'endTime': { $gte: ?3 } } " +
           "] }")
    List<Booking> findConflictingBookings(String resourceId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime);
    
    // Find pending bookings for a specific resource
    List<Booking> findByResourceIdAndStatus(String resourceId, String status);
    
    // Find bookings by date range
    List<Booking> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Count bookings by status (for dashboard)
    long countByStatus(String status);

    // Additional query methods for filtering
List<Booking> findByStatusAndResourceIdAndUserId(String status, String resourceId, String userId);
List<Booking> findByUserIdAndStatus(String userId, String status);
List<Booking> findByResourceIdAndUserId(String resourceId, String userId);

// Find bookings by resource and date
    List<Booking> findByResourceIdAndDate(String resourceId, LocalDate date);
}
