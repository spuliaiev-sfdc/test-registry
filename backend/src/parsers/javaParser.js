const
  jp = require('jsonpath'),
  parser = require("java-parser");

const javaParser = {

  checkParticularChildren(throwIfError, content, functionName, childName) {
    if (!content) {
      let errorText = `[${functionName}] object provided is UNDEFINED or NULL`;
      console.log(errorText);
      if (throwIfError) {
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    if (!content.children || !content.children[childName] || !Array.isArray(content.children[childName])) {
      let errorText = `[${functionName}] child ${childName} not found or not an array`;
      console.log(errorText);
      if (throwIfError) {
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    if (content.children[childName].length === 0) {
      let errorText = `[${functionName}] child ${childName} is empty`;
      console.log(errorText);
      if (throwIfError) {
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    let result = content.children[childName];

    if (arguments.length > 4) {
      // recursive calls to evaluate the rest of the arguments
      let args = Array.from(arguments);
      let restOfArgs = args.slice(4);
      result = this.checkParticularChildren(throwIfError, result[0], functionName, ...restOfArgs);
    }
    return result;
  },

  checkParticularChild(throwIfError, content, functionName, childName) {
    // let children = this.checkParticularChildren(throwIfError, content, functionName, childName);
    let children = this.checkParticularChildren(...arguments);
    return children ? children[0] : null;
  },

  getParticularChildValue(throwIfError, content, functionName, childName) {
    // let children = this.checkParticularChildren(throwIfError, content, functionName, childName);
    let children = this.checkParticularChildren(...arguments);
    return children ? this.extractExpressionValue(children[0]) : null;
  },

  parseJavaContent(fileContent) {
    let content = parser.parse(fileContent);
    let info = this.extractClassesInfo(content, fileContent);
    return { status: 'success', content, info };
  },

  getFirstClassDeclaration(content) {
    let ordinaryCompilationUnit = this.checkParticularChild(true, content, "getFirstClassDeclaration", "ordinaryCompilationUnit");
    let typeDeclaration = this.checkParticularChild(true, ordinaryCompilationUnit, "getFirstClassDeclaration", "typeDeclaration");
    let classDeclaration = this.checkParticularChild(true, typeDeclaration, "getFirstClassDeclaration", "classDeclaration");
    return classDeclaration;
  },

  extractAnnotationsInfo(typeDeclaration, modifierNodeName) {
    let modifiers = this.checkParticularChildren(false, typeDeclaration, "extractClassAnnotationsInfo", modifierNodeName);
    if (!modifiers) {
      return null;
    }
    let annotationsInfo = [];
    for( let i=0; i < modifiers.length; i++) {
      let annotations = this.checkParticularChildren(false, modifiers[i], "extractClassAnnotationsInfo", "annotation");
      if (annotations) {
        for (let annIndex=0; annIndex < annotations.length; annIndex++) {
          let annotation = annotations[annIndex];
          let annotationInfo = this.extractAnnotationInfo(annotation);
          annotationsInfo.push(annotationInfo);
        }
      }
    }

    return annotationsInfo;
  },

  extractClassInfo(firstClassDeclaration, typeDeclaration) {
    let classInfo = {};
    classInfo.javadoc = this.getClassJavadoc(typeDeclaration, classInfo);

    classInfo.annotations = this.extractAnnotationsInfo(firstClassDeclaration, "classModifier");
    let classDeclaration = this.checkParticularChild(true, firstClassDeclaration, "extractClassInfo", "normalClassDeclaration");

    classInfo.classType = this.getParticularChildValue(false, classDeclaration, "extractClassInfo", "Class");
    classInfo.superclass = this.getParticularChildValue(false, classDeclaration, "extractClassInfo", "superclass", "classType", "Identifier");
    classInfo.className = this.getIdentifier(classDeclaration, "typeIdentifier");

    let classBody = this.checkParticularChildren(true, classDeclaration, "extractClassInfo", "classBody", "classBodyDeclaration");

    classInfo.other = [];
    classInfo.fields = [];
    classInfo.methods = [];
    for (let memberIndex=0; memberIndex < classBody.length; memberIndex++) {
      let memberDeclaration = classBody[memberIndex];
      let memberInfo = this.extractClassBodyInfo(classInfo, memberDeclaration);
      if (!memberInfo) {
        continue;
      }
      if (memberInfo.kind === 'field') {
        classInfo.fields.push(memberInfo);
      } else {
        if (memberInfo.kind === 'method') {
          classInfo.methods.push(memberInfo);
        } else {
          classInfo.other.push(memberInfo);
        }
      }

    }


    return classInfo;
  },

  extractClassesInfo(content, textContent) {
    let classesInfo = {};
    classesInfo.classes = [];

    let ordinaryCompilationUnit = this.checkParticularChild(true, content, "getFirstClassDeclaration", "ordinaryCompilationUnit");
    let typeDeclaration = this.checkParticularChild(true, ordinaryCompilationUnit, "getFirstClassDeclaration", "typeDeclaration");
    let firstClassDeclaration = this.checkParticularChild(true, typeDeclaration, "getFirstClassDeclaration", "classDeclaration");
    let classInfo = this.extractClassInfo(firstClassDeclaration, typeDeclaration);
    classesInfo.classes.push(classInfo);

    return classesInfo;
  },

  extractExpressionValue: function (content) {
    if (!content) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(content, "image")) {
      return content.image;
    }

    let value = this.checkParticularChild(false, content, "extractExpressionValue", "expression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "ternaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "binaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "unaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "primary");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "primaryPrefix");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "literal");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "StringLiteral");
    if (!value) {
      let fqnDecl = this.checkParticularChild(false, content, "extractExpressionValue", "fqnOrRefType");
      if (fqnDecl) {
        return this.extractFQNString(fqnDecl);
      }
      let arrayDecl = this.checkParticularChild(false, content, "extractExpressionValue", "elementValueArrayInitializer", "elementValueList");
      if (arrayDecl) {
        let elements = this.checkParticularChildren(false, arrayDecl, "extractExpressionValue", "elementValue");
        value = "";
        for (let ind=0; ind < elements.length; ind ++) {
          if (value.length === 0){
            value = value + "[";
          } else {
            value = value + ", ";
          }
          value = value + this.extractExpressionValue(elements[ind]);
        }
        value = value+"]";
        return value;
      }
    }
    if (!value) {
      let props = [];
      for (var prop in content.children) {
        if (Object.prototype.hasOwnProperty.call(content.children, prop)) {
          props.push(prop);
        }
      }
      console.log(`[extractExpressionValue] failed to find expression value. Existing nodes:`, props);
      return null;
    } else {
      if (value["children"]) {
        value = this.extractExpressionValue(value);
      } else {
        if (Object.prototype.hasOwnProperty.call(value, "image")) {
          return value.image;
        } else {
          console.log(`[extractExpressionValue] failed to extract expression value. Current value node:`, value);
        }
      }
      return value;
    }
  },

  getIdentifier(identifierContainer, containerName) {
    if (containerName) {
      identifierContainer = this.checkParticularChild(false, identifierContainer, "getIdentifier", containerName);
    }
    if (!identifierContainer) {
      return null;
    }
    let identifier = this.checkParticularChild(true, identifierContainer, "getIdentifier", "Identifier");
    return identifier ? identifier.image : null;
  },

  extractAnnotationInfo(annotation) {
    let annotationInfo = {
      name: this.getIdentifier(annotation, "typeName")
    };

    annotationInfo.value = this.getParticularChildValue(false, annotation, "extractAnnotationInfo", "elementValue");

    return annotationInfo;
  },

  extractClassBodyInfo(classInfo, memberDeclaration) {
    let memberInfo = {
      kind: "unknown"
    };
    let methodDeclaration = this.checkParticularChild(false, memberDeclaration, "extractClassBodyInfo", "classMemberDeclaration", "methodDeclaration");
    if (methodDeclaration) {
      memberInfo.kind = "method";
      memberInfo.name = this.getParticularChildValue(false, methodDeclaration, "extractClassBodyInfo", "methodHeader", "methodDeclarator", "Identifier");
      memberInfo.annotations = this.extractAnnotationsInfo(methodDeclaration, "methodModifier");
    }
    let fieldDeclaration = this.checkParticularChild(false, memberDeclaration, "extractClassBodyInfo", "classMemberDeclaration", "fieldDeclaration");
    if (fieldDeclaration) {
      memberInfo.kind = "field";
      let declarator = this.checkParticularChild(false, fieldDeclaration, "extractClassBodyInfo", "variableDeclaratorList", "variableDeclarator");
      if (declarator) {
        memberInfo.name = this.getParticularChildValue(false, declarator, "extractClassBodyInfo", "variableDeclaratorId", "Identifier");
        memberInfo.value = this.getParticularChildValue(false, declarator, "extractClassBodyInfo", "variableInitializer");
      }
      memberInfo.annotations = this.extractAnnotationsInfo(fieldDeclaration, "methodModifier");
    }
    return memberInfo;
  },

  extractFQNString(fqnDecl) {
    let first = this.getParticularChildValue(false, fqnDecl, "extractFQNString", "fqnOrRefTypePartFirst", "fqnOrRefTypePartCommon", "Identifier");
    let second = this.getParticularChildValue(false, fqnDecl, "extractFQNString", "fqnOrRefTypePartRest", "fqnOrRefTypePartCommon", "Identifier");
    return first + "."+second;
  },

  getClassJavadoc(typeDeclaration, classInfo) {
    let javadoc = {};
    if (typeDeclaration && typeDeclaration.leadingComments && Array.isArray(typeDeclaration.leadingComments) && typeDeclaration.leadingComments.length > 0) {
      let javaDoc = typeDeclaration.leadingComments[0].image;

      let author = javaDoc.match(/@author\s+(.*)\s*\n/);
      if (author && author.length > 1) {
        javadoc.author = author["1"];
      }
      let since = javaDoc.match(/@since\s+(.*)\s*\n/);
      if (since && since.length > 1) {
        javadoc.since = since["1"];
      }
      let team = javaDoc.match(/@ScrumTeam\s+(.*)\s*\n/);
      if (team && team.length > 1) {
        javadoc.team = team["1"];
      }
    }
    return javadoc;
  }
};


module.exports = javaParser;
