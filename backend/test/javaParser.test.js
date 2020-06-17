var
  assert = require('assert'),
  javaParser = require('../src/parsers/javaParser');

const javaSimpleClass = `
public class HelloWorldExample{
  public static void main(String args[]){
    System.out.println("Hello World !");
  }
}
`;

const javaTestClass = `
package conversation.library;

import java.sql.PreparedStatement;
import java.util.List;
import annotation.ScrumTeam;

/**
 * Tests various insert scenarios for the sharing record collection entities
 *
 * @author alicia.ong
 * @since 228
 */
@ScrumTeam("Team_01")
public class SharingRecordCollectionInsertFTest extends SharingRecordCollectionBaseTest{

    /**
     * Tests that the number of entries field on sharing record collection
     * is reflected correctly.
     * @expectedResults The sharing record collection with 2 items reports there are 2 items
     */
    @TestLabels(IgnoreFailureReason.IN_DEV)
    public void testNumEntriesCorrect() throws Exception{
        String srcId = createSharingRecordCollection(standardUser);
        String voiceCallId = conversationEnablementTestService.createVoiceCallAndVoiceCallRecordingAsUser(standardUser);
        String voiceCallId2 = conversationEnablementTestService.createVoiceCallAndVoiceCallRecordingAsUser(standardUser);
        createSharingRecordCollectionItem(srcId, voiceCallId);
    }

    /**
     * Tests that bad data on sharing record collection does not prevent the save of the other
     * sharing record collection item on bulk save
     * @expectedResults other item saved successfully
     * @throws Exception
     */
    @ScrumTeam("Team_02")
    public void testPartialSharingRecordCollectionItemSave() throws Exception {
        String badCollection = createSharingRecordCollection(standardUser);
        removeGroupIdFromCollection(badCollection);
        String goodCollection = createSharingRecordCollection(standardUser);
    }

}
`;


describe('javaParser', function() {
  describe('#parseJavaContent() - Simple Class', function() {
    it('should successfully parse simple Java', function() {
      let parsingResult = javaParser.parseJavaContent(javaSimpleClass);
      assert.equal(parsingResult.status, 'success');
    });
  });
  describe('#parseJavaContent() - Simple Test Class', function() {
    it('should successfully parse simple Test Java', function() {
      let parsingResult = javaParser.parseJavaContent(javaTestClass);
      assert.equal(parsingResult.status, 'success');
      assert.deepEqual(parsingResult.info, {
        "classes": [{
          "annotations": [{"name": "ScrumTeam", "value": '"Team_01"'}],
          "classType": "class",
          "superclass": "SharingRecordCollectionBaseTest",
          "className": "SharingRecordCollectionInsertFTest",
          "other": [],
          "fields": [],
          "methods": [{
            "kind": "method",
            "name": "testNumEntriesCorrect",
            "annotations": [{"name": "TestLabels", "value": "IgnoreFailureReason.IN_DEV"}]
          }, {
            "kind": "method",
            "name": "testPartialSharingRecordCollectionItemSave",
            "annotations": [{"name": "ScrumTeam", "value": '"Team_02"'}]
          }]
        }]
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
      let parsingResult = javaParser.checkParticularChildren(false, content, "test_01", "child1");
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
      let parsingResult = javaParser.checkParticularChildren(false, content, "test_01", "child1", "child2", "child3", "child4");
      assert.equal(!parsingResult, false);
      assert.equal(Array.isArray(parsingResult), true);
      assert.equal(typeof parsingResult[0], 'object');
      assert.equal(parsingResult[0].image, 'result');
    });
  });
});
