var
  assert = require('assert'),
  fs = require('fs'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  javaParser = require('../src/parsers/javaParser');

const javaSimpleClass = `
public class HelloWorldExample{
  public static void main(String args[]){
    System.out.println("Hello World !");
  }
}
`;

const javaTestClass = `
package some.production.folder;

import java.sql.PreparedStatement;
import java.util.List;
import annotation.ScrumTeam;

/**
 * Tests various insert scenarios for the some production java class
 *
 * @author developer.name
 * @since version.01
 */
@ScrumTeam("Team_01")
public class SimpleJavaTest extends JavaBaseTest {

    /**
     * Tests some initial method 01 in the prod class
     */
    @TestLabels(IgnoreFailureReason.IN_DEV)
    public void testFirstMethod_01() throws Exception{
        // Do some testing 01
    }

    /**
     * Tests some initial method 02 in the prod class
     */
    @ScrumTeam("Team_02")
    @TestLabelsArray({ IgnoreFailureReason.Label1, IgnoreFailureReason.Label2 })
    public void testSecondMethod_02() throws Exception {
        // Do some other testing 02
    }
    
    public void fsetPresetup(){
    }
    
    private void internalMethod() {
    }

}
`;

const javaDocClass = `
package sample.packaged;

import some.Annotation;

/**
 * Example of class
 *
 * @author user.name
 * @since 2020.05.01
 */
@Annotation("Value01")
public class SampleClass extends SuperClass {
  int field01;
  String field02 = "TextValue_01";
}
`;

describe('javaParserSample', function() {
  describe('#parseJavaContent()', function () {
    it('should successfully parse simple Java', function () {
      let parser = require('java-parser');
      let content = parser.parse(javaDocClass);
      assert.equal(content != null, true);
    });
  });
});

describe('javaParser', function() {
  describe('#parseJavaContent() - Simple Class', function() {
    it('should successfully parse simple Java', function() {
      let fileInfo = { relative: 'SomeFile.java' };
      let parsingResult = javaParser.parseJavaContent(javaSimpleClass, fileInfo);
      assert.equal(parsingResult.success, true);
    });
  });
  describe('#parseJavaContent() - Simple Test Class', function() {
    it('should successfully parse simple Java with JavaDoc', function() {
      let fileInfo = { relative: 'SomeFile.java', testKind: 'sample' };
      let parsingResult = javaParser.parseJavaContent(javaDocClass, fileInfo);
      assert.equal(parsingResult.success, true);
      assert.deepEqual(parsingResult.info, {
        classes: [{
          'annotations': [{
            'name': 'Annotation',
            'value': 'Value01'
          }],
          'classType': 'class',
          'superclass': 'SuperClass',
          'className': 'SampleClass',
          'other': [],
          'fields': [
            {
              'kind': 'field',
              'name': 'field01',
              'value': null,
              'annotations': null
            },
            {
              'kind': 'field',
              'name': 'field02',
              'value': 'TextValue_01',
              'annotations': null
            }
          ],
          'javadoc': {
            'author': 'user.name',
            'since': '2020.05.01'
          },
          'methods': []
        }],
        testLibs: "sample"
      });
    });
    // it('should fail to parse Particular Test Java', function() {
      // let someContent = fs.readFileSync("/Users/spuliaiev/blt/app/main/core/ui-services-private/test/unit/java/src/strictunit/ui/services/internal/cache/UnAuthorizedSerializableForTest.java", 'utf8');
      // let someContent = fs.readFileSync("/Users/spuliaiev/blt/app/main/core/industries-mfg-rebates/test/func/java/src/industries/mfg/rebates/entities/rebatetypebenefit/ProgramRebateTypeBenefitCreateTest.java", 'utf8');
      // let someContent = fs.readFileSync("/Users/spuliaiev/blt/app/main/core/zero-shared/test/unit/java/src/strictunit/zero/zorse/ZorseMessageEnqueueTest.java", 'utf8');
      // let fileInfo = { relative: 'SomeFile.java' };
      // let parsingResult = javaParser.parseJavaContent(someContent, fileInfo);
      // assert.equal(parsingResult.success, false);
    // });
    it('should successfully parse simple Test Java', function() {
      let fileInfo = { relative: 'SomeFile.java' };
      let parsingResult = javaParser.parseJavaContent(javaTestClass, fileInfo);
      assert.equal(parsingResult.success, true);
      assert.deepEqual(parsingResult.javaOwnershipInfo, {
        classInfo: {
          labels: [],
          owners: [
            { name: 'Team_01', desc: ['ScrumTeam class annotation'] }
          ],
          ownersPartial: [
            { name: 'Team_02', desc: ['ScrumTeam method annotation'] }
          ],
          partialIN_DEV: [
            "testFirstMethod_01"
          ]
        },
        ignoredMethods: [
          'fsetPresetup',
          'internalMethod'
        ],
        methodsInfo: [
          {
            IN_DEV: true,
            labels: [
              { name: 'IgnoreFailureReason.IN_DEV', desc: ['TestLabel method annotation']}
            ],
            name: 'testFirstMethod_01',
            owners: []
          },
          {
            labels: [],
            name: 'testSecondMethod_02',
            owners: [
              { name: 'Team_02', desc: ['ScrumTeam method annotation'] }
            ]
          }
        ]
      });
    });
  });
  describe('#checkParticularChildren() - Recursive params', function() {
    it('basic evaluation', function() {
      let content = {
        children: {
          child1: [{
            image: 'result'
          }]
        }
      };
      let parsingResult = javaParser.checkParticularChildren(false, content, 'test_01', 'child1');
      assert.equal(!parsingResult, false);
      assert.equal(Array.isArray(parsingResult), true);
      assert.equal(typeof parsingResult[0], 'object');
      assert.equal(parsingResult[0].image, 'result');
    });
    it('should successfully recursively call itself', function() {
      let content = {
        children: {
          child1: [{
            children: {
              child2: [{
                children: {
                  child3: [{
                    children: {
                      child4: [{
                        image: 'result'
                      }]
                    }
                  }]
                }
              }]
            }
          }]
        }
      };
      let parsingResult = javaParser.checkParticularChildren(false, content, 'test_01', 'child1', 'child2', 'child3', 'child4');
      assert.equal(!parsingResult, false);
      assert.equal(Array.isArray(parsingResult), true);
      assert.equal(typeof parsingResult[0], 'object');
      assert.equal(parsingResult[0].image, 'result');
    });
  });
});
