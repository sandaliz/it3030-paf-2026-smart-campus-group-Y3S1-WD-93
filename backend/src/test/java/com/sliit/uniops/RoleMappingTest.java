package com.sliit.uniops;

import com.sliit.uniops.model.Role;
import com.sliit.uniops.service.RoleMappingService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class RoleMappingTest {
    
    @Test
    public void testAdminEmailMapping() {
        RoleMappingService service = new RoleMappingService();
        
        // Test your specific email
        Role result = service.parseRoleFromEmail("subhaniadmin@gmail.com");
        System.out.println("Role for subhaniadmin@gmail.com: " + result);
        
        // Should be ADMIN
        assertEquals(Role.ADMIN, result);
        
        // Test other admin patterns
        assertEquals(Role.ADMIN, service.parseRoleFromEmail("admin@domain.com"));
        assertEquals(Role.ADMIN, service.parseRoleFromEmail("user.admin@domain.com"));
        assertEquals(Role.ADMIN, service.parseRoleFromEmail("john.admin.sliit@gmail.com"));
    }
    
    @Test
    public void testOtherRoles() {
        RoleMappingService service = new RoleMappingService();
        
        assertEquals(Role.STUDENT, service.parseRoleFromEmail("student@gmail.com"));
        assertEquals(Role.TECHNICIAN, service.parseRoleFromEmail("tech@domain.com"));
        assertEquals(Role.LECTURER, service.parseRoleFromEmail("lecturer@domain.com"));
        assertEquals(Role.BOOKING_MANAGER, service.parseRoleFromEmail("bookingmanager@domain.com"));
    }
}
