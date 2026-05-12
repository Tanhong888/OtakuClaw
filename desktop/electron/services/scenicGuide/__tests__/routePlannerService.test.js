/**
 * Unit Tests for RoutePlannerService
 * Tests route planning logic, preference matching, and recommendation generation
 */

const {
  RoutePlannerService,
  INTEREST_CATEGORIES,
  CROWD_TYPES,
  STAMINA_LEVELS,
} = require('../routePlannerService');

// Mock knowledge store for testing
class MockKnowledgeStore {
  constructor() {
    this.spots = [
      {
        id: 'LS-001',
        name: '灵山大佛',
        category: 'historical',
        tags: ['历史文化', '佛教', '地标'],
        recommendedDuration: 30,
      },
      {
        id: 'LS-002',
        name: '九龙灌浴',
        category: 'scenic',
        tags: ['表演', '音乐喷泉'],
        recommendedDuration: 20,
      },
      {
        id: 'LS-003',
        name: '梵宫',
        category: 'cultural',
        tags: ['历史文化', '建筑艺术', '佛教艺术'],
        recommendedDuration: 40,
      },
      {
        id: 'LS-004',
        name: '五印坛城',
        category: 'cultural',
        tags: ['藏传佛教', '文化'],
        recommendedDuration: 25,
      },
      {
        id: 'LS-005',
        name: '祥符禅寺',
        category: 'historical',
        tags: ['历史', '古寺'],
        recommendedDuration: 20,
      },
      {
        id: 'NH-001',
        name: '拈花湾',
        category: 'scenic',
        tags: ['自然风光', '禅意'],
        recommendedDuration: 60,
      },
    ];

    this.routes = [
      {
        id: 'route-history',
        name: '历史文化爱好者路线',
        interests: ['历史文化'],
        duration: 150,
        spots: ['LS-001', 'LS-003', 'LS-004', 'LS-005'],
        description: '深度体验灵山胜境的历史文化底蕴',
      },
      {
        id: 'route-nature',
        name: '自然风光爱好者路线',
        interests: ['自然风光'],
        duration: 120,
        spots: ['LS-002', 'NH-001'],
        description: '欣赏灵山胜境的自然美景',
      },
      {
        id: 'route-family',
        name: '亲子家庭路线',
        interests: ['亲子'],
        duration: 90,
        spots: ['LS-001', 'LS-002', 'LS-003'],
        description: '适合全家游览的轻松路线',
      },
    ];
  }

  listSpots() {
    return this.spots;
  }

  listRoutes() {
    return this.routes;
  }

  getSpotById(id) {
    return this.spots.find(s => s.id === id);
  }

  getRouteById(id) {
    return this.routes.find(r => r.id === id);
  }
}

function runTests() {
  console.log('🧪 Testing RoutePlannerService...\n');

  const mockStore = new MockKnowledgeStore();
  const service = new RoutePlannerService({ knowledgeStore: mockStore });

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Service initialization
  console.log('--- Testing Service Initialization ---');
  try {
    assert(service.getAvailableInterests().length > 0, 'Should have available interests');
    console.log('✓ Service initializes correctly');
    passedTests++;
  } catch (error) {
    console.error('✗ Service initialization failed:', error.message);
    failedTests++;
  }

  // Test 2: History interest route matching
  console.log('\n--- Testing History Interest Matching ---');
  try {
    const result = service.planRoute({
      interests: ['历史文化'],
      duration: 120,
      crowd: 'adult',
      stamina: 'normal',
    });

    assert(result, 'Should return a result');
    assert(result.route, 'Should have a route');
    assert(
      result.route.name.includes('历史文化') || result.route.interests?.includes('历史文化'),
      'Should match history interest'
    );
    assert(Array.isArray(result.spots), 'Should have spots array');
    assert(result.spots.length > 0, 'Should have at least one spot');
    console.log('✓ History interest route matching works');
    console.log(`  Route: ${result.route.name}`);
    console.log(`  Spots: ${result.spots.length} spots`);
    passedTests += 3;
  } catch (error) {
    console.error('✗ History interest matching failed:', error.message);
    failedTests += 3;
  }

  // Test 3: Nature interest route matching
  console.log('\n--- Testing Nature Interest Matching ---');
  try {
    const result = service.planRoute({
      interests: ['自然风光'],
      duration: 120,
      crowd: 'adult',
      stamina: 'normal',
    });

    assert(result, 'Should return a result');
    assert(
      result.route.name.includes('自然风光') || result.route.interests?.includes('自然风光'),
      'Should match nature interest'
    );
    console.log('✓ Nature interest route matching works');
    passedTests += 2;
  } catch (error) {
    console.error('✗ Nature interest matching failed:', error.message);
    failedTests += 2;
  }

  // Test 4: Duration trimming
  console.log('\n--- Testing Duration-Based Route Trimming ---');
  try {
    // Request a short duration (60 minutes)
    const result = service.planRoute({
      interests: ['历史文化'],
      duration: 60,
      crowd: 'adult',
      stamina: 'normal',
    });

    assert(result, 'Should return a result');
    assert(result.spots, 'Should have spots');
    assert(result.spots.length < 4, 'Should trim spots for shorter duration');
    console.log('✓ Duration trimming works');
    console.log(`  Requested: 60 min, Provided: ${result.spots.length} spots`);
    passedTests += 3;
  } catch (error) {
    console.error('✗ Duration trimming failed:', error.message);
    failedTests += 3;
  }

  // Test 5: Recommendation reason generation
  console.log('\n--- Testing Recommendation Reason Generation ---');
  try {
    const result = service.planRoute({
      interests: ['历史文化'],
      duration: 120,
      crowd: 'family',
      stamina: 'normal',
    });

    assert(result, 'Should return a result');
    assert(result.reason, 'Should have a reason');
    assert(typeof result.reason === 'string', 'Reason should be a string');
    assert(
      result.reason.includes('✓') || result.reason.includes('推荐'),
      'Reason should have format markers'
    );
    console.log('✓ Recommendation reason generation works');
    console.log(`  Reason preview: ${result.reason.substring(0, 100)}...`);
    passedTests += 4;
  } catch (error) {
    console.error('✗ Recommendation reason generation failed:', error.message);
    failedTests += 4;
  }

  // Test 6: Crowd-based filtering
  console.log('\n--- Testing Crowd-Based Filtering ---');
  try {
    const familyResult = service.planRoute({
      interests: ['亲子'],
      duration: 90,
      crowd: 'family',
      stamina: 'low',
    });

    assert(familyResult, 'Should return a result for family crowd');
    assert(familyResult.spots, 'Should have spots for family');
    console.log('✓ Crowd-based filtering works');
    passedTests += 2;
  } catch (error) {
    console.error('✗ Crowd-based filtering failed:', error.message);
    failedTests += 2;
  }

  // Test 7: Available options retrieval
  console.log('\n--- Testing Available Options Retrieval ---');
  try {
    const interests = service.getAvailableInterests();
    const crowds = service.getAvailableCrowds();
    const stamina = service.getAvailableStamina();

    assert(Array.isArray(interests), 'Interests should be an array');
    assert(interests.length > 0, 'Should have interests');
    assert(Array.isArray(crowds), 'Crowds should be an array');
    assert(crowds.length > 0, 'Should have crowds');
    assert(Array.isArray(stamina), 'Stamina should be an array');
    assert(stamina.length > 0, 'Should have stamina levels');
    console.log('✓ Available options retrieval works');
    console.log(`  Interests: ${interests.length}, Crowds: ${crowds.length}, Stamina: ${stamina.length}`);
    passedTests += 6;
  } catch (error) {
    console.error('✗ Available options retrieval failed:', error.message);
    failedTests += 6;
  }

  // Test 8: Edge case - empty preferences
  console.log('\n--- Testing Edge Case: Empty Preferences ---');
  try {
    const result = service.planRoute({});

    assert(result, 'Should handle empty preferences');
    assert(result.route, 'Should still provide a route');
    console.log('✓ Empty preferences handled gracefully');
    passedTests += 2;
  } catch (error) {
    console.error('✗ Empty preferences handling failed:', error.message);
    failedTests += 2;
  }

  // Test 9: Edge case - very short duration
  console.log('\n--- Testing Edge Case: Very Short Duration ---');
  try {
    const result = service.planRoute({
      interests: ['历史文化'],
      duration: 15,
      crowd: 'adult',
      stamina: 'normal',
    });

    assert(result, 'Should handle very short duration');
    assert(result.spots, 'Should provide spots even for short duration');
    assert(result.spots.length <= 2, 'Should limit spots for very short duration');
    console.log('✓ Very short duration handled correctly');
    passedTests += 3;
  } catch (error) {
    console.error('✗ Very short duration handling failed:', error.message);
    failedTests += 3;
  }

  // Test 10: Route metadata completeness
  console.log('\n--- Testing Route Metadata Completeness ---');
  try {
    const result = service.planRoute({
      interests: ['历史文化'],
      duration: 120,
      crowd: 'adult',
      stamina: 'normal',
    });

    assert(result, 'Should return a result');
    assert(result.spots, 'Should have spots');
    assert(result.totalDuration, 'Should have total duration');
    assert(Array.isArray(result.spots), 'Spots should be an array');

    // Check if spots have required metadata
    if (result.spots.length > 0) {
      const firstSpot = result.spots[0];
      assert(firstSpot.id, 'Spot should have ID');
      assert(firstSpot.name, 'Spot should have name');
      assert(typeof firstSpot.recommendedDuration === 'number', 'Spot should have duration');
    }

    console.log('✓ Route metadata is complete');
    passedTests += 5;
  } catch (error) {
    console.error('✗ Route metadata check failed:', error.message);
    failedTests += 5;
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('========================================');

  return failedTests === 0;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests, MockKnowledgeStore };
