package com.sliit.uniops.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sliit.uniops.model.Resource;
import com.sliit.uniops.repository.ResourceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Resource testResource1;
    private Resource testResource2;

    @BeforeEach
    void setUp() {
        resourceRepository.deleteAll();

        // Create test resources
        testResource1 = Resource.builder()
                .name("Computer Lab 101")
                .type(Resource.ResourceType.LAB)
                .capacity(30)
                .location("Building A, Floor 2")
                .status(Resource.ResourceStatus.ACTIVE)
                .description("Computer lab with 30 workstations")
                .amenities(Arrays.asList("Projector", "Whiteboard", "WiFi"))
                .availabilityWindows(Arrays.asList(
                        new Resource.AvailabilityWindow("MONDAY", "09:00", "17:00", true),
                        new Resource.AvailabilityWindow("TUESDAY", "09:00", "17:00", true)
                ))
                .createdBy("admin")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testResource2 = Resource.builder()
                .name("Lecture Hall A")
                .type(Resource.ResourceType.LECTURE_HALL)
                .capacity(100)
                .location("Building B, Floor 1")
                .status(Resource.ResourceStatus.ACTIVE)
                .description("Large lecture hall")
                .amenities(Arrays.asList("Projector", "Sound System", "AC"))
                .createdBy("admin")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testResource1 = resourceRepository.save(testResource1);
        testResource2 = resourceRepository.save(testResource2);
    }

    @AfterEach
    void tearDown() {
        resourceRepository.deleteAll();
    }

    @Test
    void testGetAllResources() throws Exception {
        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Computer Lab 101", "Lecture Hall A")));
    }

    @Test
    void testGetAllResourcesWithFilters() throws Exception {
        // Filter by type
        mockMvc.perform(get("/api/resources")
                        .param("type", "LAB"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Computer Lab 101"));

        // Filter by status
        mockMvc.perform(get("/api/resources")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Filter by min capacity
        mockMvc.perform(get("/api/resources")
                        .param("minCapacity", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Lecture Hall A"));

        // Filter by location
        mockMvc.perform(get("/api/resources")
                        .param("location", "Building A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Computer Lab 101"));
    }

    @Test
    void testGetResourcesPaginated() throws Exception {
        mockMvc.perform(get("/api/resources/paginated")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.totalPages").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    void testGetResourceById() throws Exception {
        mockMvc.perform(get("/api/resources/{id}", testResource1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testResource1.getId()))
                .andExpect(jsonPath("$.name").value("Computer Lab 101"))
                .andExpect(jsonPath("$.type").value("LAB"))
                .andExpect(jsonPath("$.capacity").value(30));
    }

    @Test
    void testGetResourceById_NotFound() throws Exception {
        mockMvc.perform(get("/api/resources/{id}", "nonexistentid"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testCreateResource() throws Exception {
        Resource newResource = Resource.builder()
                .name("Meeting Room 202")
                .type(Resource.ResourceType.MEETING_ROOM)
                .capacity(10)
                .location("Building C, Floor 2")
                .status(Resource.ResourceStatus.ACTIVE)
                .description("Small meeting room")
                .amenities(Arrays.asList("Whiteboard", "Video Conferencing"))
                .build();

        mockMvc.perform(post("/api/resources")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newResource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Meeting Room 202"))
                .andExpect(jsonPath("$.type").value("MEETING_ROOM"))
                .andExpect(jsonPath("$.id").exists());

        // Verify resource was saved
        long count = resourceRepository.count();
        assertEquals(3, count);
    }

    @Test
    @WithMockUser(roles = "USER")
    void testCreateResource_Unauthorized() throws Exception {
        Resource newResource = Resource.builder()
                .name("Unauthorized Resource")
                .type(Resource.ResourceType.EQUIPMENT)
                .capacity(5)
                .location("Storage")
                .status(Resource.ResourceStatus.ACTIVE)
                .build();

        mockMvc.perform(post("/api/resources")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newResource)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testCreateResource_ValidationError() throws Exception {
        Resource invalidResource = Resource.builder()
                .name("") // Empty name should fail validation
                .type(Resource.ResourceType.LAB)
                .capacity(30)
                .location("Building A")
                .status(Resource.ResourceStatus.ACTIVE)
                .build();

        mockMvc.perform(post("/api/resources")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidResource)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testGetMyResources() throws Exception {
        mockMvc.perform(get("/api/resources/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateResource() throws Exception {
        Resource updatedResource = Resource.builder()
                .name("Computer Lab 101 - Updated")
                .type(Resource.ResourceType.LAB)
                .capacity(40) // Increased capacity
                .location("Building A, Floor 2")
                .status(Resource.ResourceStatus.ACTIVE)
                .description("Updated description")
                .amenities(Arrays.asList("Projector", "Whiteboard", "WiFi", "New Equipment"))
                .build();

        mockMvc.perform(put("/api/resources/{id}", testResource1.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedResource)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Computer Lab 101 - Updated"))
                .andExpect(jsonPath("$.capacity").value(40));

        // Verify update in database
        Resource savedResource = resourceRepository.findById(testResource1.getId()).orElse(null);
        assertNotNull(savedResource);
        assertEquals(40, savedResource.getCapacity());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateResourceStatus() throws Exception {
        mockMvc.perform(patch("/api/resources/{id}/status", testResource1.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"OUT_OF_SERVICE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_OF_SERVICE"));

        // Verify status update in database
        Resource savedResource = resourceRepository.findById(testResource1.getId()).orElse(null);
        assertNotNull(savedResource);
        assertEquals(Resource.ResourceStatus.OUT_OF_SERVICE, savedResource.getStatus());
    }

    @Test
    void testTrackShare() throws Exception {
        mockMvc.perform(patch("/api/resources/{id}/share", testResource1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareCount").value(1));

        // Track share again
        mockMvc.perform(patch("/api/resources/{id}/share", testResource1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareCount").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testDeleteResource() throws Exception {
        mockMvc.perform(delete("/api/resources/{id}", testResource1.getId())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // Verify deletion
        assertFalse(resourceRepository.findById(testResource1.getId()).isPresent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testDeleteResource_NotFound() throws Exception {
        mockMvc.perform(delete("/api/resources/{id}", "nonexistentid")
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetResourceAvailability() throws Exception {
        mockMvc.perform(get("/api/resources/{id}/availability", testResource1.getId())
                        .param("date", "2026-04-21")) // Monday
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resourceId").value(testResource1.getId()))
                .andExpect(jsonPath("$.date").value("2026-04-21"))
                .andExpect(jsonPath("$.dayOfWeek").value("MONDAY"))
                .andExpect(jsonPath("$.isAvailable").value(true))
                .andExpect(jsonPath("$.availability").isArray());
    }

    @Test
    void testCheckResourceAvailability() throws Exception {
        mockMvc.perform(get("/api/resources/{id}/availability/check", testResource1.getId())
                        .param("date", "2026-04-21") // Monday
                        .param("startTime", "10:00")
                        .param("endTime", "11:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resourceId").value(testResource1.getId()))
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.date").value("2026-04-21"))
                .andExpect(jsonPath("$.startTime").value("10:00"))
                .andExpect(jsonPath("$.endTime").value("11:00"));
    }

    @Test
    void testCheckResourceAvailability_OutsideWindow() throws Exception {
        mockMvc.perform(get("/api/resources/{id}/availability/check", testResource1.getId())
                        .param("date", "2026-04-21") // Monday
                        .param("startTime", "18:00") // Outside 09:00-17:00 window
                        .param("endTime", "19:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void testGetResourceAudit() throws Exception {
        mockMvc.perform(get("/api/resources/{id}/audit", testResource1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].action").value("RESOURCE_CREATED"))
                .andExpect(jsonPath("$[1].action").value("RESOURCE_LAST_UPDATED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testBulkCreateResources() throws Exception {
        List<Resource> resources = Arrays.asList(
                Resource.builder()
                        .name("Equipment 1")
                        .type(Resource.ResourceType.EQUIPMENT)
                        .capacity(1)
                        .location("Storage A")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .build(),
                Resource.builder()
                        .name("Equipment 2")
                        .type(Resource.ResourceType.EQUIPMENT)
                        .capacity(1)
                        .location("Storage A")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .build()
        );

        mockMvc.perform(post("/api/resources/bulk")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resources)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)));

        // Verify resources were saved
        long count = resourceRepository.count();
        assertEquals(4, count); // 2 initial + 2 new
    }

    @Test
    void testSearchResources() throws Exception {
        mockMvc.perform(get("/api/resources")
                        .param("search", "Computer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Computer Lab 101"));

        mockMvc.perform(get("/api/resources")
                        .param("search", "Building"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }
}
